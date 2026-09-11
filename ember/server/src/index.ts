/**
 * EMBER's game server: a small HTTP surface for accounts, and a WebSocket
 * where the tables actually happen.
 */

import { createServer } from 'node:http';

import { WebSocketServer, type WebSocket } from 'ws';

import {
  ERROR_TEXT,
  PROTOCOL_VERSION,
  type ClientMessage,
  type ErrorCode,
  type ServerMessage,
} from '../../shared/protocol';
import { userForToken } from './auth';
import { config } from './config';
import { db, sweepExpiredSessions } from './db';
import { bearer, handleRequest } from './http';
import { Hub } from './hub';
import { RoomError, type Connection } from './room';
import { statsFor } from './stats';

db();

const http = createServer((request, response) => {
  void handleRequest(request, response);
});

const wss = new WebSocketServer({
  server: http,
  path: '/ws',
  // A move is a few hundred bytes; nothing legitimate comes close to this.
  maxPayload: 64 * 1024,
});

const hub = new Hub();

interface Session {
  socket: WebSocket;
  connection: Connection;
  alive: boolean;
  /** Rough flood control: messages seen in the current second. */
  budget: number;
  budgetAt: number;
}

const sessions = new Map<string, Session>();

function send(socket: WebSocket, message: ServerMessage): void {
  if (socket.readyState === socket.OPEN) socket.send(JSON.stringify(message));
}

function fail(socket: WebSocket, code: ErrorCode): void {
  send(socket, { type: 'error', code, message: ERROR_TEXT[code] });
}

wss.on('connection', (socket, request) => {
  let session: Session | null = null;

  // A socket that never says who it is does not get to hang around.
  const helloTimer = setTimeout(() => {
    if (!session) socket.close(4001, 'no hello');
  }, 10_000);

  socket.on('pong', () => {
    if (session) session.alive = true;
  });

  socket.on('message', (raw) => {
    let message: ClientMessage;
    try {
      message = JSON.parse(String(raw)) as ClientMessage;
    } catch {
      fail(socket, 'bad_message');
      return;
    }
    if (!message || typeof message.type !== 'string') {
      fail(socket, 'bad_message');
      return;
    }

    if (!session) {
      if (message.type !== 'hello') {
        fail(socket, 'unauthorised');
        socket.close(4003, 'unauthorised');
        return;
      }
      if (message.version !== PROTOCOL_VERSION) {
        fail(socket, 'version_mismatch');
        socket.close(4004, 'version');
        return;
      }

      const user = userForToken(String(message.token ?? '')) ?? userForToken(bearer(request));
      if (!user) {
        fail(socket, 'unauthorised');
        socket.close(4003, 'unauthorised');
        return;
      }

      clearTimeout(helloTimer);

      // One socket per account: a second sign-in takes the seat over.
      const previous = sessions.get(user.id);
      if (previous && previous.socket !== socket) {
        previous.socket.close(4005, 'signed in elsewhere');
      }

      session = {
        socket,
        connection: {
          userId: user.id,
          name: user.name,
          send: (out) => send(socket, out),
        },
        alive: true,
        budget: 0,
        budgetAt: Date.now(),
      };
      sessions.set(user.id, session);

      send(socket, { type: 'welcome', user, version: PROTOCOL_VERSION });
      send(socket, { type: 'stats', stats: statsFor(user.id) });

      // Straight back to the table if they were at one.
      const room = hub.roomFor(user.id);
      if (room) {
        room.join(session.connection);
      }
      return;
    }

    const now = Date.now();
    if (now - session.budgetAt > 1000) {
      session.budget = 0;
      session.budgetAt = now;
    }
    session.budget += 1;
    if (session.budget > 40) {
      fail(socket, 'rate_limited');
      return;
    }

    handle(session, message);
  });

  socket.on('close', () => {
    clearTimeout(helloTimer);
    if (!session) return;
    const held = sessions.get(session.connection.userId);
    if (held?.socket === socket) sessions.delete(session.connection.userId);
    hub.disconnect(session.connection.userId);
  });

  socket.on('error', () => {
    // A broken pipe is not news; 'close' does the tidying.
  });
});

function handle(session: Session, message: ClientMessage): void {
  const { connection, socket } = session;
  try {
    switch (message.type) {
      case 'ping':
        send(socket, { type: 'pong' });
        return;

      case 'create_room':
        hub.create(connection, {
          targetScore: message.targetScore,
          maxSeats: message.maxSeats,
        });
        return;

      case 'join_room':
        hub.join(connection, String(message.code ?? ''));
        return;

      case 'quick_match': {
        const room = hub.quickMatch(connection);
        if (room.status === 'lobby') {
          send(socket, {
            type: 'queued',
            waiting: room.connectedHumans.length,
            startsInMs: room.quickMatchStartsAt ? room.quickMatchStartsAt - Date.now() : null,
          });
        }
        return;
      }

      case 'cancel_quick_match':
        hub.cancelQuickMatch(connection.userId);
        send(socket, { type: 'left' });
        return;

      case 'leave_room':
        hub.leave(connection.userId);
        send(socket, { type: 'left' });
        return;

      case 'add_bot':
        requireRoom(connection.userId).addBot(connection.userId, message.difficulty);
        return;

      case 'remove_seat':
        requireRoom(connection.userId).removeSeat(connection.userId, String(message.seatId ?? ''));
        return;

      case 'start_game':
        requireRoom(connection.userId).start(connection.userId);
        return;

      case 'action':
        requireRoom(connection.userId).submit(connection.userId, message.action);
        return;

      case 'next_round':
        requireRoom(connection.userId).requestNextRound(connection.userId);
        return;

      default:
        fail(socket, 'bad_message');
    }
  } catch (error) {
    if (error instanceof RoomError) {
      fail(socket, error.code);
      return;
    }
    fail(socket, 'server_error');
  }
}

function requireRoom(userId: string) {
  const room = hub.roomFor(userId);
  if (!room) throw new RoomError('not_in_room');
  return room;
}

/* Sockets that have gone quiet without closing are cut loose. */
const heartbeat = setInterval(() => {
  for (const session of sessions.values()) {
    if (!session.alive) {
      session.socket.terminate();
      continue;
    }
    session.alive = false;
    session.socket.ping();
  }
}, 30_000);
heartbeat.unref?.();

const housekeeping = setInterval(() => sweepExpiredSessions(), 3600_000);
housekeeping.unref?.();

http.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`ember server listening on :${config.port}`);
});

function shutdown(): void {
  clearInterval(heartbeat);
  clearInterval(housekeeping);
  hub.stop();
  for (const session of sessions.values()) session.socket.close(1001, 'server going away');
  wss.close();
  http.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 3000).unref?.();
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export { http, hub, wss };

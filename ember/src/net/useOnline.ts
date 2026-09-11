/**
 * The socket, and everything that arrives over it.
 *
 * The client is deliberately dumb: it sends what you tapped and draws what the
 * server says you can see. It holds no game rules of its own, so a modified
 * app cannot see a card the server did not send.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { ExpressionId } from '../../shared/expressions';
import {
  PROTOCOL_VERSION,
  type ClientMessage,
  type ErrorCode,
  type PublicUser,
  type RankState,
  type RoomView,
  type ServerMessage,
  type UserStats,
} from '../../shared/protocol';
import type { GameAction } from '../../shared/types';
import type { TableView } from '../../shared/view';
import { useTalk } from '../ui/talk';
import { socketUrl } from './api';

export type ConnectionStatus = 'idle' | 'connecting' | 'online' | 'reconnecting' | 'failed';

export interface TableState {
  view: TableView;
  clock: { playerId: string; endsAt: number } | null;
  nextRoundAt: number | null;
}

export interface QueueState {
  waiting: number;
  startsInMs: number | null;
}

const BACKOFF_MS = [1000, 2000, 4000, 8000, 15000];

export function useOnline(token: string | null) {
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [user, setUser] = useState<PublicUser | null>(null);
  const [room, setRoom] = useState<RoomView | null>(null);
  const [table, setTable] = useState<TableState | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [rank, setRank] = useState<RankState | null>(null);
  const talk = useTalk();
  const { say, hush } = talk;
  const [queue, setQueue] = useState<QueueState | null>(null);
  // Kept as the code the server sent, so the wording can be in any language.
  const [error, setError] = useState<ErrorCode | null>(null);

  const socket = useRef<WebSocket | null>(null);
  const attempt = useRef(0);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeat = useRef<ReturnType<typeof setInterval> | null>(null);
  const closing = useRef(false);
  /** Cards you have been shown this round, kept for Assist mode. */
  const seen = useRef<{ round: number; slots: Record<string, boolean> }>({ round: 0, slots: {} });

  const send = useCallback((message: ClientMessage) => {
    const live = socket.current;
    if (live && live.readyState === WebSocket.OPEN) live.send(JSON.stringify(message));
  }, []);

  const receive = useCallback((message: ServerMessage) => {
    switch (message.type) {
      case 'welcome':
        setUser(message.user);
        setStatus('online');
        setError(null);
        attempt.current = 0;
        break;
      case 'room':
        setRoom(message.room);
        setTable(null);
        break;
      case 'table': {
        setRoom(message.room);
        setQueue(null);
        setTable({ view: message.view, clock: message.clock, nextRoundAt: message.nextRoundAt });

        // Remember what you have been shown, the way you would at a real table.
        const view = message.view;
        if (seen.current.round !== view.round) seen.current = { round: view.round, slots: {} };
        const you = view.players.find((player) => player.id === view.youId);
        if (you && view.phase !== 'ROUND_OVER' && view.phase !== 'MATCH_OVER') {
          you.slots.forEach((slot, index) => {
            if (slot.kind === 'face') seen.current.slots[`${view.youId}:${index}`] = true;
          });
        }
        break;
      }
      case 'left':
        setRoom(null);
        setTable(null);
        setQueue(null);
        hush();
        break;
      case 'queued':
        setQueue({ waiting: message.waiting, startsInMs: message.startsInMs });
        break;
      case 'stats':
        setStats(message.stats);
        setRank(message.rank);
        break;
      case 'expression':
        say(message.fromId, message.id, message.targetId);
        break;
      case 'error':
        setError(message.code);
        break;
      case 'pong':
        break;
    }
  }, [say, hush]);

  /* ---------------------------------------------------------------- */
  /* the connection                                                    */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    closing.current = false;

    if (!token) {
      socket.current?.close();
      socket.current = null;
      setStatus('idle');
      setUser(null);
      setRoom(null);
      setTable(null);
      return;
    }

    const clearRetry = () => {
      if (retryTimer.current) clearTimeout(retryTimer.current);
      retryTimer.current = null;
    };

    const open = () => {
      clearRetry();
      setStatus(attempt.current === 0 ? 'connecting' : 'reconnecting');

      let live: WebSocket;
      try {
        live = new WebSocket(socketUrl());
      } catch {
        retry();
        return;
      }
      socket.current = live;

      live.onopen = () => {
        live.send(JSON.stringify({ type: 'hello', token, version: PROTOCOL_VERSION }));
      };
      live.onmessage = (event) => {
        try {
          receive(JSON.parse(String(event.data)) as ServerMessage);
        } catch {
          // A message we cannot parse is not worth tearing the socket down for.
        }
      };
      live.onerror = () => {
        // 'close' always follows; the retry is handled there.
      };
      live.onclose = (event) => {
        socket.current = null;
        if (closing.current) return;
        // The server closes with 4003 when the token is no longer good, and
        // reconnecting with the same token would only fail the same way.
        if (event.code === 4003 || event.code === 4004) {
          setStatus('failed');
          setError(event.code === 4004 ? 'version_mismatch' : 'unauthorised');
          return;
        }
        retry();
      };
    };

    const retry = () => {
      const wait = BACKOFF_MS[Math.min(attempt.current, BACKOFF_MS.length - 1)];
      attempt.current += 1;
      setStatus('reconnecting');
      clearRetry();
      retryTimer.current = setTimeout(open, wait);
    };

    open();

    heartbeat.current = setInterval(() => send({ type: 'ping' }), 20_000);

    return () => {
      closing.current = true;
      clearRetry();
      if (heartbeat.current) clearInterval(heartbeat.current);
      heartbeat.current = null;
      socket.current?.close();
      socket.current = null;
    };
  }, [token, receive, send]);

  /* ---------------------------------------------------------------- */

  const actions = useMemo(
    () => ({
      createRoom: (targetScore?: number) => send({ type: 'create_room', targetScore }),
      joinRoom: (code: string) => send({ type: 'join_room', code: code.toUpperCase().trim() }),
      quickMatch: () => send({ type: 'quick_match' }),
      cancelQuickMatch: () => send({ type: 'cancel_quick_match' }),
      leaveRoom: () => send({ type: 'leave_room' }),
      addBot: (difficulty: 'easy' | 'normal' | 'sharp') => send({ type: 'add_bot', difficulty }),
      removeSeat: (seatId: string) => send({ type: 'remove_seat', seatId }),
      startGame: () => send({ type: 'start_game' }),
      nextRound: () => send({ type: 'next_round' }),
      play: (action: GameAction) => send({ type: 'action', action }),
      express: (id: ExpressionId, targetId?: string | null) =>
        send({ type: 'express', id, targetId: targetId ?? undefined }),
    }),
    [send],
  );

  return {
    status,
    user,
    setUser,
    room,
    table,
    stats,
    rank,
    said: talk.said,
    queue,
    error,
    clearError: useCallback(() => setError(null), []),
    yourMemory: seen.current.slots as Record<string, unknown>,
    ...actions,
  };
}

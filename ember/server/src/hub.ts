/**
 * The registry of tables: who is at which one, how codes are minted, and the
 * quick-match queue that turns strangers into a game.
 */

import { randomInt } from 'node:crypto';

import { ROOM_CODE_ALPHABET, ROOM_CODE_LENGTH } from '../../shared/protocol';
import type { Difficulty } from '../../shared/types';
import { config } from './config';
import { Room, RoomError, type Connection } from './room';

export class Hub {
  private rooms = new Map<string, Room>();
  private byUser = new Map<string, string>();
  /** The public room currently taking all comers, if there is one. */
  private openPublicCode: string | null = null;
  private quickMatchTimer: ReturnType<typeof setTimeout> | null = null;
  private sweeper: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.sweeper = setInterval(() => this.sweep(), 60_000);
    this.sweeper.unref?.();
  }

  get size(): number {
    return this.rooms.size;
  }

  roomFor(userId: string): Room | undefined {
    const code = this.byUser.get(userId);
    return code ? this.rooms.get(code) : undefined;
  }

  private mintCode(): string {
    for (let attempt = 0; attempt < 50; attempt++) {
      let code = '';
      for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
        code += ROOM_CODE_ALPHABET[randomInt(ROOM_CODE_ALPHABET.length)];
      }
      if (!this.rooms.has(code)) return code;
    }
    throw new RoomError('server_error');
  }

  /* ---------------------------------------------------------------- */

  create(connection: Connection, options: { targetScore?: number; maxSeats?: number } = {}): Room {
    if (this.rooms.size >= config.maxRooms) throw new RoomError('server_error');
    this.leave(connection.userId);

    const code = this.mintCode();
    const room = new Room(
      code,
      connection,
      true,
      clamp(options.targetScore ?? 100, 20, 500),
      clamp(options.maxSeats ?? config.maxSeats, 3, config.maxSeats),
      (dead) => this.drop(dead),
    );
    this.rooms.set(code, room);
    this.byUser.set(connection.userId, code);
    return room;
  }

  join(connection: Connection, rawCode: string): Room {
    const code = (rawCode ?? '').toUpperCase().trim();
    const room = this.rooms.get(code);
    if (!room) throw new RoomError('no_such_room');

    // Coming back to a table you are already at is always allowed.
    if (!room.has(connection.userId)) {
      this.leave(connection.userId);
    }
    room.join(connection);
    this.byUser.set(connection.userId, code);
    return room;
  }

  /** Drops you into whichever public table is filling up, or opens one. */
  quickMatch(connection: Connection): Room {
    const open = this.openPublicCode ? this.rooms.get(this.openPublicCode) : undefined;

    if (open && open.status === 'lobby' && open.seats.length < open.maxSeats) {
      const room = this.join(connection, open.code);
      if (room.connectedHumans.length >= 3) {
        this.cancelQuickMatchTimer();
        this.openPublicCode = null;
        room.start();
      }
      return room;
    }

    this.leave(connection.userId);
    const code = this.mintCode();
    const room = new Room(
      code,
      connection,
      false,
      100,
      Math.min(4, config.maxSeats),
      (dead) => this.drop(dead),
    );
    this.rooms.set(code, room);
    this.byUser.set(connection.userId, code);
    this.openPublicCode = code;

    // Wait a little for other people, then deal anyway and fill the empty
    // seats with bots — better than leaving someone staring at a queue.
    const waitMs = config.quickMatchWaitSeconds * 1000;
    room.quickMatchStartsAt = Date.now() + waitMs;
    this.cancelQuickMatchTimer();
    this.quickMatchTimer = setTimeout(() => {
      this.quickMatchTimer = null;
      this.openPublicCode = null;
      const waiting = this.rooms.get(code);
      if (!waiting || waiting.status !== 'lobby') return;
      if (waiting.connectedHumans.length === 0) {
        this.drop(waiting);
        return;
      }
      const host = waiting.hostId;
      const difficulties: Difficulty[] = ['normal', 'sharp', 'easy'];
      let index = 0;
      while (waiting.seats.length < 3) {
        waiting.addBot(host, difficulties[index % difficulties.length]);
        index += 1;
      }
      waiting.quickMatchStartsAt = null;
      waiting.start();
    }, waitMs);
    this.quickMatchTimer.unref?.();

    return room;
  }

  cancelQuickMatch(userId: string): void {
    const room = this.roomFor(userId);
    if (!room || room.isPrivate || room.status !== 'lobby') return;
    this.leave(userId);
  }

  /* ---------------------------------------------------------------- */

  leave(userId: string): void {
    const room = this.roomFor(userId);
    if (!room) return;
    this.byUser.delete(userId);
    room.leave(userId);
    if (room.isDead) this.drop(room);
  }

  disconnect(userId: string): void {
    const room = this.roomFor(userId);
    if (!room) return;
    room.disconnect(userId);
    // The seat is held so they can come back; the mapping stays with it.
    if (room.status === 'lobby' && !room.has(userId)) this.byUser.delete(userId);
    if (room.isDead) this.drop(room);
  }

  private drop(room: Room): void {
    room.dispose();
    this.rooms.delete(room.code);
    if (this.openPublicCode === room.code) {
      this.openPublicCode = null;
      this.cancelQuickMatchTimer();
    }
    for (const [userId, code] of this.byUser) {
      if (code === room.code) this.byUser.delete(userId);
    }
  }

  private cancelQuickMatchTimer(): void {
    if (this.quickMatchTimer) clearTimeout(this.quickMatchTimer);
    this.quickMatchTimer = null;
  }

  /** Clears out tables nobody came back to. */
  private sweep(now = Date.now()): void {
    for (const room of [...this.rooms.values()]) {
      const idleFor = now - room.lastActivityAt;
      if (room.isDead && idleFor > config.reconnectSeconds * 1000) this.drop(room);
      else if (idleFor > 6 * 3600_000) this.drop(room);
    }
  }

  stop(): void {
    this.cancelQuickMatchTimer();
    if (this.sweeper) clearInterval(this.sweeper);
    for (const room of this.rooms.values()) room.dispose();
    this.rooms.clear();
    this.byUser.clear();
  }
}

function clamp(value: number, low: number, high: number): number {
  return Math.min(high, Math.max(low, Math.round(value)));
}

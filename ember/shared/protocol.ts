/**
 * The wire. Both the phone and the server import this file, so a message
 * either side cannot understand is a compile error rather than a bug that
 * only shows up on someone's table.
 */

import type { ExpressionId } from './expressions';
import type { Tier } from './progress';
import type { Difficulty, GameAction } from './types';
import type { TableView } from './view';

export const PROTOCOL_VERSION = 1;

/** The shape of a room code: six characters, no look-alikes. */
export const ROOM_CODE_ALPHABET = 'ACDEFGHJKLMNPQRTUVWXY34679';
export const ROOM_CODE_LENGTH = 6;

export interface PublicUser {
  id: string;
  name: string;
  /** "flame:coral" — the mark beside the name. See shared/progress. */
  avatar: string;
}

/** Where somebody stands this season. */
export interface RankState {
  season: string;
  /** When the season's board is wiped and everyone starts again. */
  endsAt: number;
  points: number;
  tier: Tier;
  matches: number;
  wins: number;
  /** Place on the season board, or null while they are below the cut. */
  place: number | null;
}

export interface UserStats {
  matches: number;
  wins: number;
  rounds: number;
  roundWins: number;
  knocks: number;
  knocksStuck: number;
  burns: number;
  misfires: number;
  ashOuts: number;
  /** Lowest pile ever taken to a showdown. Null until you finish a round. */
  bestRound: number | null;
  totalPoints: number;
}

export interface LeaderboardRow {
  userId: string;
  name: string;
  avatar: string;
  matches: number;
  wins: number;
  winRate: number;
  bestRound: number | null;
  /** Season points and rank. Zero on the all-time board, which is not ranked. */
  points: number;
  tier: Tier;
}

export type BoardScope = 'season' | 'allTime';

export interface Board {
  scope: BoardScope;
  season: string;
  endsAt: number;
  rows: LeaderboardRow[];
  /** Your own row, wherever you are on it — pinned so you never have to hunt. */
  you: (LeaderboardRow & { place: number }) | null;
}

export interface Seat {
  id: string;
  name: string;
  avatar: string;
  isBot: boolean;
  connected: boolean;
  difficulty: Difficulty;
}

export type RoomStatus = 'lobby' | 'playing' | 'finished';

export interface RoomView {
  code: string;
  hostId: string;
  status: RoomStatus;
  isPrivate: boolean;
  seats: Seat[];
  maxSeats: number;
  targetScore: number;
}

/* ------------------------------------------------------------------ */
/* phone → server                                                      */
/* ------------------------------------------------------------------ */

export type ClientMessage =
  | { type: 'hello'; token: string; version: number }
  | { type: 'create_room'; targetScore?: number; maxSeats?: number }
  | { type: 'join_room'; code: string }
  | { type: 'quick_match' }
  | { type: 'cancel_quick_match' }
  | { type: 'leave_room' }
  | { type: 'add_bot'; difficulty: Difficulty }
  | { type: 'remove_seat'; seatId: string }
  | { type: 'start_game' }
  | { type: 'action'; action: GameAction }
  | { type: 'next_round' }
  | { type: 'express'; id: ExpressionId; targetId?: string }
  | { type: 'ping' };

/* ------------------------------------------------------------------ */
/* server → phone                                                      */
/* ------------------------------------------------------------------ */

export type ServerMessage =
  | { type: 'welcome'; user: PublicUser; version: number }
  | { type: 'room'; room: RoomView }
  | { type: 'left' }
  | { type: 'queued'; waiting: number; startsInMs: number | null }
  | {
      type: 'table';
      room: RoomView;
      view: TableView;
      /** Whose clock is running, and when it runs out. */
      clock: { playerId: string; endsAt: number } | null;
      /** When the server will deal the next round on its own. */
      nextRoundAt: number | null;
    }
  | { type: 'stats'; stats: UserStats; rank: RankState }
  | {
      type: 'expression';
      /** The seat that said it, and the seat it was aimed at, if any. */
      fromId: string;
      targetId: string | null;
      id: ExpressionId;
    }
  | { type: 'error'; code: ErrorCode; message: string }
  | { type: 'pong' };

export type ErrorCode =
  | 'bad_message'
  | 'unauthorised'
  | 'version_mismatch'
  | 'no_such_room'
  | 'room_full'
  | 'room_in_play'
  | 'not_host'
  | 'not_in_room'
  | 'need_players'
  | 'not_your_move'
  | 'rate_limited'
  | 'too_chatty'
  | 'server_error';

/** Human-readable wording for anything the server refuses. */
export const ERROR_TEXT: Record<ErrorCode, string> = {
  bad_message: 'The app sent something the table did not understand.',
  unauthorised: 'You need to sign in again.',
  version_mismatch: 'This app is out of date. Update to keep playing online.',
  no_such_room: 'No room with that code.',
  room_full: 'That room is full.',
  room_in_play: 'That game has already started.',
  not_host: 'Only the host can do that.',
  not_in_room: 'You are not at a table.',
  need_players: 'You need at least three at the table.',
  not_your_move: 'It is not your move.',
  rate_limited: 'Too many tries. Wait a moment.',
  too_chatty: 'Give the table a moment.',
  server_error: 'Something went wrong at our end.',
};

/**
 * One table.
 *
 * The room owns the game state. It never sends that state anywhere — each seat
 * is handed its own redacted view instead — and it checks every incoming move
 * against whose turn it actually is before the rules engine ever sees it.
 */

import { observeTransition, seedMemory, type BotMemory } from '../../shared/ai';
import { Autoplay } from '../../shared/autoplay';
import { createMatch, currentPlayer, playerById, reduce } from '../../shared/engine';
import { EXPRESSION_LIMIT, isExpressionId, type ExpressionId } from '../../shared/expressions';
import { avatarFromSeed, formatAvatar } from '../../shared/progress';
import type { ErrorCode, RoomStatus, RoomView, Seat, ServerMessage } from '../../shared/protocol';
import type { Difficulty, GameAction, GameState } from '../../shared/types';
import { canAct, viewFor } from '../../shared/view';
import { config } from './config';
import { rankFor, recordMatch, recordRound, statsFor, type RoundDelta } from './stats';

export interface Connection {
  userId: string;
  name: string;
  avatar: string;
  send(message: ServerMessage): void;
}

const BOT_NAMES = ['Rashid', 'Noura', 'Salem', 'Maitha', 'Khalid'];

export class RoomError extends Error {
  constructor(readonly code: ErrorCode) {
    super(code);
  }
}

export class Room {
  status: RoomStatus = 'lobby';
  seats: Seat[] = [];
  hostId: string;

  private connections = new Map<string, Connection>();
  private state: GameState | null = null;
  private memories: Record<string, BotMemory> = {};
  private autoplay = new Autoplay();
  private timers = new Set<ReturnType<typeof setTimeout>>();
  private clock: { playerId: string; endsAt: number } | null = null;
  private nextRoundAt: number | null = null;
  private roundDeltas: Record<string, RoundDelta> = {};
  private botSeq = 0;
  /** When each seat last said something, for the rate limit. */
  private chatter = new Map<string, number[]>();

  /** Set while a public room is waiting for more people to turn up. */
  quickMatchStartsAt: number | null = null;
  lastActivityAt = Date.now();

  constructor(
    readonly code: string,
    host: Connection,
    readonly isPrivate: boolean,
    readonly targetScore: number,
    readonly maxSeats: number,
    private readonly onEmpty: (room: Room) => void,
  ) {
    this.hostId = host.userId;
    this.join(host);
  }

  /* ---------------------------------------------------------------- */
  /* people coming and going                                           */
  /* ---------------------------------------------------------------- */

  get humanSeats(): Seat[] {
    return this.seats.filter((seat) => !seat.isBot);
  }

  get connectedHumans(): Seat[] {
    return this.humanSeats.filter((seat) => seat.connected);
  }

  has(userId: string): boolean {
    return this.seats.some((seat) => seat.id === userId);
  }

  join(connection: Connection): void {
    const existing = this.seats.find((seat) => seat.id === connection.userId);

    if (existing) {
      // Somebody coming back to a seat they already hold.
      existing.connected = true;
      existing.name = connection.name;
      existing.avatar = connection.avatar;
      this.connections.set(connection.userId, connection);
      this.touch();
      this.schedule();
      this.broadcast();
      return;
    }

    if (this.status !== 'lobby') throw new RoomError('room_in_play');
    if (this.seats.length >= this.maxSeats) throw new RoomError('room_full');

    this.seats.push({
      id: connection.userId,
      name: connection.name,
      avatar: connection.avatar,
      isBot: false,
      connected: true,
      difficulty: 'normal',
    });
    this.connections.set(connection.userId, connection);
    this.touch();
    this.broadcast();
  }

  /** A socket went away. The seat stays; a bot covers it until they return. */
  disconnect(userId: string): void {
    const seat = this.seats.find((entry) => entry.id === userId);
    this.connections.delete(userId);
    if (!seat) return;

    if (this.status === 'lobby') {
      this.seats = this.seats.filter((entry) => entry.id !== userId);
    } else {
      seat.connected = false;
    }

    this.rehost();
    if (this.connectedHumans.length === 0) {
      this.close();
      return;
    }
    this.touch();
    this.schedule();
    this.broadcast();
  }

  /** Deliberately leaving gives the seat up for good. */
  leave(userId: string): void {
    this.seats = this.seats.filter((seat) => seat.id !== userId);
    this.connections.delete(userId);
    this.rehost();

    if (this.connectedHumans.length === 0) {
      this.close();
      return;
    }
    if (this.state) {
      // Mid-game the seat has to keep playing or the deal falls apart, so it
      // becomes a bot rather than vanishing.
      const player = playerById(this.state, userId);
      if (player) {
        player.isBot = true;
        this.seats.push({
          id: userId,
          name: player.name,
          avatar: formatAvatar(avatarFromSeed(userId)),
          isBot: true,
          connected: true,
          difficulty: 'normal',
        });
      }
    }
    this.touch();
    this.schedule();
    this.broadcast();
  }

  private rehost(): void {
    if (this.seats.some((seat) => seat.id === this.hostId && !seat.isBot)) return;
    const next = this.connectedHumans[0] ?? this.humanSeats[0];
    if (next) this.hostId = next.id;
  }

  private close(): void {
    this.clearTimers();
    this.onEmpty(this);
  }

  /* ---------------------------------------------------------------- */
  /* the lobby                                                         */
  /* ---------------------------------------------------------------- */

  addBot(userId: string, difficulty: Difficulty): void {
    this.requireHost(userId);
    if (this.status !== 'lobby') throw new RoomError('room_in_play');
    if (this.seats.length >= this.maxSeats) throw new RoomError('room_full');

    const taken = new Set(this.seats.map((seat) => seat.name));
    const name = BOT_NAMES.find((candidate) => !taken.has(candidate)) ?? `Bot ${this.botSeq + 1}`;
    const id = `bot:${this.code}:${this.botSeq++}`;
    this.seats.push({
      id,
      name,
      avatar: formatAvatar(avatarFromSeed(id)),
      isBot: true,
      connected: true,
      difficulty,
    });
    this.touch();
    this.broadcast();
  }

  removeSeat(userId: string, seatId: string): void {
    this.requireHost(userId);
    if (this.status !== 'lobby') throw new RoomError('room_in_play');
    const seat = this.seats.find((entry) => entry.id === seatId);
    if (!seat) return;
    // The host can clear out bots; people leave under their own steam.
    if (!seat.isBot) throw new RoomError('not_host');
    this.seats = this.seats.filter((entry) => entry.id !== seatId);
    this.touch();
    this.broadcast();
  }

  private requireHost(userId: string): void {
    if (userId !== this.hostId) throw new RoomError('not_host');
  }

  /* ---------------------------------------------------------------- */
  /* playing                                                           */
  /* ---------------------------------------------------------------- */

  start(userId?: string): void {
    if (userId) this.requireHost(userId);
    if (this.status !== 'lobby') throw new RoomError('room_in_play');
    if (this.seats.length < 3) throw new RoomError('need_players');

    this.status = 'playing';
    this.quickMatchStartsAt = null;
    this.state = createMatch({
      seats: this.seats.map((seat) => ({
        id: seat.id,
        name: seat.name,
        isBot: seat.isBot,
        difficulty: seat.difficulty,
      })),
      config: { targetScore: this.targetScore, burnWindowMs: config.burnWindowMs },
    });
    this.seedMemories();
    this.autoplay = new Autoplay();
    this.roundDeltas = {};
    this.touch();
    this.schedule();
    this.broadcast();
  }

  private seedMemories(): void {
    const state = this.state;
    if (!state) return;
    this.memories = {};
    for (const player of state.players) {
      // Bots memorise their two nearest cards; people start blank and fill it
      // in as the table shows them things.
      this.memories[player.id] = player.isBot ? seedMemory(state, player.id) : {};
    }
  }

  /** A move that came off somebody's phone. */
  submit(userId: string, action: GameAction): void {
    const state = this.state;
    if (!state || this.status !== 'playing') throw new RoomError('not_in_room');
    if (!this.has(userId)) throw new RoomError('not_in_room');
    if (!canAct(state, userId, action)) throw new RoomError('not_your_move');

    this.countForStats(state, userId, action);
    // A move the rules will not take is worth saying so about, rather than
    // leaving a phone waiting for a table that already moved on.
    if (!this.apply(action)) throw new RoomError('not_your_move');
  }

  /**
   * Something said at the table.
   *
   * The sender is whoever is holding the socket — never a seat they name —
   * so nobody can put words in somebody else's mouth. The id is checked
   * against the fixed list, which is the whole reason there is a fixed list.
   */
  express(userId: string, id: ExpressionId, targetId?: string): void {
    if (!this.has(userId)) throw new RoomError('not_in_room');
    if (!isExpressionId(id)) throw new RoomError('bad_message');
    if (!this.canSpeak(userId)) throw new RoomError('too_chatty');

    const target = targetId && targetId !== userId && this.has(targetId) ? targetId : null;
    const message: ServerMessage = { type: 'expression', fromId: userId, targetId: target, id };
    for (const connection of this.connections.values()) connection.send(message);
    this.touch();
  }

  /** A gap between anything, and a ceiling on how much of it in a while. */
  private canSpeak(userId: string, now = Date.now()): boolean {
    const said = (this.chatter.get(userId) ?? []).filter(
      (at) => now - at < EXPRESSION_LIMIT.windowMs,
    );
    const last = said[said.length - 1];
    if (last != null && now - last < EXPRESSION_LIMIT.gapMs) return false;
    if (said.length >= EXPRESSION_LIMIT.perWindow) return false;
    said.push(now);
    this.chatter.set(userId, said);
    return true;
  }

  /** Any player may hurry the table along once a round is scored. */
  requestNextRound(userId: string): void {
    if (!this.has(userId)) throw new RoomError('not_in_room');
    if (this.state?.phase !== 'ROUND_OVER') return;
    this.apply({ type: 'NEXT_ROUND' });
  }

  /** Returns false when the rules refused the move and nothing changed. */
  private apply(action: GameAction): boolean {
    const previous = this.state;
    if (!previous) return false;
    const next = reduce(previous, action, Date.now());
    if (next === previous) return false;

    if (next.round !== previous.round) {
      this.seedMemories();
      this.autoplay = new Autoplay();
      this.roundDeltas = {};
    } else {
      for (const player of next.players) {
        // A person's own record of what they have been shown never slips; it
        // is what a bot uses if it has to cover their seat.
        const random = player.isBot ? Math.random : () => 0;
        this.memories[player.id] = observeTransition(
          this.memories[player.id] ?? {},
          previous,
          next,
          player.id,
          random,
        );
      }
    }

    this.state = next;
    this.touch();

    if (previous.phase !== 'ROUND_OVER' && next.phase === 'ROUND_OVER') this.finishRound(next);
    if (previous.phase !== 'MATCH_OVER' && next.phase === 'MATCH_OVER') {
      this.finishRound(next);
      this.finishMatch(next);
    }

    this.schedule();
    this.broadcast();
    return true;
  }

  /* ---------------------------------------------------------------- */
  /* timers                                                            */
  /* ---------------------------------------------------------------- */

  private clearTimers(): void {
    for (const timer of this.timers) clearTimeout(timer);
    this.timers.clear();
  }

  private later(run: () => void, delayMs: number): void {
    const timer = setTimeout(() => {
      this.timers.delete(timer);
      try {
        run();
      } catch {
        // A timer firing into a room that has moved on is not worth a crash.
      }
    }, Math.max(0, delayMs));
    this.timers.add(timer);
  }

  private schedule(): void {
    this.clearTimers();
    this.clock = null;
    this.nextRoundAt = null;

    const state = this.state;
    if (!state || this.status !== 'playing') return;

    if (state.phase === 'MATCH_OVER') return;

    if (state.phase === 'ROUND_OVER') {
      this.nextRoundAt = Date.now() + config.roundBreakSeconds * 1000;
      this.later(() => this.apply({ type: 'NEXT_ROUND' }), config.roundBreakSeconds * 1000);
      return;
    }

    const waitFor = this.connectedHumans.map((seat) => seat.id);
    for (const move of this.autoplay.movesFor(state, this.memories, waitFor)) {
      this.later(() => this.apply(move.action), move.delayMs);
    }

    // Nobody gets to hold up a table by staring at their phone.
    const pending = this.pendingHumans(state, waitFor);
    if (pending.length > 0) {
      const endsAt = Date.now() + config.turnSeconds * 1000;
      this.clock = {
        playerId: state.phase === 'OPENING_PEEK' ? '*' : pending[0],
        endsAt,
      };
      this.later(() => this.playForIdle(pending), config.turnSeconds * 1000);
    }
  }

  /** The connected people this table is currently waiting on. */
  private pendingHumans(state: GameState, connected: string[]): string[] {
    if (state.phase === 'OPENING_PEEK') {
      return connected.filter(
        (id) =>
          (state.openingPeeksLeft[id] ?? 0) > 0 ||
          state.reveals.some((reveal) => reveal.viewerId === id),
      );
    }
    const waiting = state.reveals
      .filter((reveal) => connected.includes(reveal.viewerId))
      .map((reveal) => reveal.viewerId);
    if (waiting.length > 0) return waiting;
    if (state.phase === 'BURN_WINDOW') return []; // the window has its own clock
    const seat = currentPlayer(state);
    return connected.includes(seat.id) ? [seat.id] : [];
  }

  /** Plays a reasonable move on behalf of whoever ran out of time. */
  private playForIdle(playerIds: string[]): void {
    for (const playerId of playerIds) {
      const state = this.state;
      if (!state) return;

      if (state.phase === 'OPENING_PEEK') {
        let left = state.openingPeeksLeft[playerId] ?? 0;
        let slot = 0;
        while (left > 0 && slot < 8) {
          this.apply({ type: 'OPENING_PEEK', playerId, slot });
          left = this.state?.openingPeeksLeft[playerId] ?? 0;
          slot += 1;
        }
        if (this.state?.reveals.some((reveal) => reveal.viewerId === playerId)) {
          this.apply({ type: 'ACK_REVEAL', playerId });
        }
        continue;
      }

      if (state.reveals.some((reveal) => reveal.viewerId === playerId)) {
        this.apply({ type: 'ACK_REVEAL', playerId });
        continue;
      }

      const move = Autoplay.moveFor(state, playerId, this.memories[playerId] ?? {});
      if (move) this.apply(move);
    }
  }

  /* ---------------------------------------------------------------- */
  /* records                                                           */
  /* ---------------------------------------------------------------- */

  private countForStats(state: GameState, userId: string, action: GameAction): void {
    if (action.type !== 'BURN' || !state.burn) return;
    // The card being reached for may be somebody else's; the record belongs
    // to whoever reached.
    const owner = playerById(state, action.ownerId);
    const card = owner?.slots[action.slot];
    if (!card) return;
    const delta = (this.roundDeltas[userId] ??= {});
    if (card.rank === state.burn.rank) delta.burns = (delta.burns ?? 0) + 1;
    else delta.misfires = (delta.misfires ?? 0) + 1;
  }

  private finishRound(state: GameState): void {
    if (!state.result) return;
    const humans = this.humanSeats.map((seat) => seat.id);
    if (humans.length === 0) return;
    try {
      recordRound(humans, state.result, this.roundDeltas);
    } catch {
      // A table should never fall over because a record could not be written.
    }
    this.roundDeltas = {};
  }

  private finishMatch(state: GameState): void {
    this.status = 'finished';
    const humans = this.humanSeats;
    if (humans.length > 0) {
      try {
        recordMatch(
          humans.map((seat) => ({
            userId: seat.id,
            score: playerById(state, seat.id)?.matchScore ?? 0,
          })),
          state.matchWinnerId,
          this.seats.length,
          // A rank means something only when somebody else was across the
          // table. One human and a row of bots plays for the fun of it.
          humans.length >= 2,
        );
        for (const seat of humans) {
          this.connections
            .get(seat.id)
            ?.send({ type: 'stats', stats: statsFor(seat.id), rank: rankFor(seat.id) });
        }
      } catch {
        // As above: records are secondary to the game itself.
      }
    }
  }

  /* ---------------------------------------------------------------- */
  /* telling everyone what they can see                                */
  /* ---------------------------------------------------------------- */

  view(): RoomView {
    return {
      code: this.code,
      hostId: this.hostId,
      status: this.status,
      isPrivate: this.isPrivate,
      seats: this.seats.map((seat) => ({ ...seat })),
      maxSeats: this.maxSeats,
      targetScore: this.targetScore,
    };
  }

  broadcast(): void {
    const room = this.view();
    const state = this.state;

    for (const [userId, connection] of this.connections) {
      if (!state || this.status === 'lobby') {
        connection.send({ type: 'room', room });
        continue;
      }
      const connected: Record<string, boolean> = {};
      for (const seat of this.seats) connected[seat.id] = seat.isBot || seat.connected;

      connection.send({
        type: 'table',
        room,
        // The one place a player's cards are chosen for them. Everything a
        // seat is not entitled to see is gone before this leaves the process.
        view: viewFor(state, userId, connected),
        clock: this.clock,
        nextRoundAt: this.nextRoundAt,
      });
    }
  }

  private touch(): void {
    this.lastActivityAt = Date.now();
  }

  /** Used by the sweeper for rooms nobody came back to. */
  get isDead(): boolean {
    return this.connections.size === 0;
  }

  dispose(): void {
    this.clearTimers();
    this.connections.clear();
  }
}

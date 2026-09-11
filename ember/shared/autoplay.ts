/**
 * Everything the game does without being told: bots taking their turns, cards
 * that were shown to someone putting themselves away, and the burn window's
 * clock running out.
 *
 * Both tables use this — the phone when you play the bots offline, and the
 * server when you play people online — so the two can never drift apart on
 * how long a bot thinks or when a window shuts.
 */

import { decide, decideBurn, thinkingTime, type BotMemory } from './ai';
import { currentPlayer } from './engine';
import type { GameAction, GameState } from './types';

export interface ScheduledMove {
  action: GameAction;
  /** Milliseconds from now. */
  delayMs: number;
}

export class Autoplay {
  /** One burn decision per window, so a bot cannot re-roll its nerve. */
  private plan: {
    window: number;
    moves: Array<{ playerId: string; ownerId: string; slot: number; at: number }>;
  } = { window: -1, moves: [] };

  constructor(private readonly random: () => number = Math.random) {}

  /**
   * What the table should do on its own right now. Callers set the timers and
   * re-ask after every change.
   *
   * `waitFor` lists the players who answer for themselves — the human on this
   * phone, or every connected person at an online table. Anyone left out is
   * covered by the bot logic, which is what lets a dropped player be carried.
   */
  movesFor(
    state: GameState,
    memories: Record<string, BotMemory>,
    waitFor: string[],
    now: number = Date.now(),
  ): ScheduledMove[] {
    if (state.phase === 'ROUND_OVER' || state.phase === 'MATCH_OVER') return [];

    const isTheirs = (playerId: string) => waitFor.includes(playerId);

    // Something is face up. A card shown to a person waits for them to put it
    // away; everything else clears itself. Several can be open at once during
    // the opening look, so each is handled on its own.
    if (state.reveals.length > 0) {
      const moves: ScheduledMove[] = [];
      for (const reveal of state.reveals) {
        if (reveal.viewerId === '*') {
          moves.push({ action: { type: 'ACK_REVEAL', playerId: '*' }, delayMs: 1500 });
        } else if (!isTheirs(reveal.viewerId)) {
          moves.push({ action: { type: 'ACK_REVEAL', playerId: reveal.viewerId }, delayMs: 620 });
        }
      }
      // Nothing else happens while a card is face up on the table.
      return moves;
    }

    if (state.phase === 'BURN_WINDOW' && state.burn) {
      const moves: ScheduledMove[] = [];

      if (this.plan.window !== state.burn.closesAt) {
        const planned: Array<{ playerId: string; ownerId: string; slot: number; at: number }> = [];
        for (const player of state.players) {
          if (isTheirs(player.id)) continue; // people spot their own burns
          const move = decideBurn(state, player.id, memories[player.id] ?? {}, this.random);
          if (move && move.type === 'BURN') {
            const quickness = player.difficulty === 'sharp' ? 700 : 1200;
            planned.push({
              playerId: player.id,
              ownerId: move.ownerId,
              slot: move.slot,
              at: now + 380 + this.random() * quickness,
            });
          }
        }
        this.plan = { window: state.burn.closesAt, moves: planned };
      }

      for (const move of this.plan.moves) {
        if (state.burn.attempted.includes(move.playerId)) continue;
        moves.push({
          action: {
            type: 'BURN',
            playerId: move.playerId,
            ownerId: move.ownerId,
            slot: move.slot,
          },
          delayMs: move.at - now,
        });
      }

      moves.push({ action: { type: 'CLOSE_BURN', now }, delayMs: state.burn.closesAt - now });
      return moves;
    }

    const seat = currentPlayer(state);
    if (
      !isTheirs(seat.id) &&
      (state.phase === 'TURN_START' || state.phase === 'HOLDING' || state.phase === 'POWER')
    ) {
      const move = decide(state, seat.id, memories[seat.id] ?? {});
      if (move) return [{ action: move, delayMs: thinkingTime(state, seat.difficulty) }];
    }

    return [];
  }

  /**
   * The move a player would have made if they had been paying attention. Used
   * when a turn clock runs out, so one idle person cannot freeze a table.
   */
  static moveFor(state: GameState, playerId: string, memory: BotMemory): GameAction | null {
    return decide(state, playerId, memory);
  }
}

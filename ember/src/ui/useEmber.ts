import { useCallback, useEffect, useRef, useState } from 'react';

import {
  decide,
  decideBurn,
  observeTransition,
  seedMemory,
  thinkingTime,
  type BotMemory,
} from '../game/ai';
import { createMatch, currentPlayer, HUMAN_ID, reduce, type MatchOptions } from '../game/engine';
import type { GameAction, GameState } from '../game/types';

/**
 * Wires the pure engine to React: holds the state, gives the bots their
 * thinking time, runs the burn window's clock, and keeps a perfect record of
 * what the human has been shown (used only by Assist mode).
 */
export function useEmber(options: MatchOptions) {
  const [state, setState] = useState<GameState>(() => createMatch(options));
  const stateRef = useRef(state);
  const memories = useRef<Record<string, BotMemory>>({});
  const timers = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const burnPlan = useRef<{ window: number; moves: Array<{ botId: string; slot: number; at: number }> }>({
    window: -1,
    moves: [],
  });

  const seedAll = useCallback((game: GameState) => {
    for (const player of game.players) {
      memories.current[player.id] = player.isBot
        ? seedMemory(game, player.id)
        : {}; // you start knowing nothing until you choose your two peeks
    }
  }, []);

  // First deal.
  const seeded = useRef(false);
  if (!seeded.current) {
    seedAll(state);
    seeded.current = true;
  }

  const clearTimers = useCallback(() => {
    for (const timer of timers.current) clearTimeout(timer);
    timers.current = [];
  }, []);

  const later = useCallback((run: () => void, ms: number) => {
    timers.current.push(setTimeout(run, Math.max(0, ms)));
  }, []);

  const dispatch = useCallback(
    (action: GameAction) => {
      const previous = stateRef.current;
      const next = reduce(previous, action, Date.now());
      if (next === previous) return;

      if (next.round !== previous.round) {
        seedAll(next);
      } else {
        for (const player of next.players) {
          // The human's own record never slips; that is what makes Assist
          // mode a training aid rather than a different game.
          const random = player.isBot ? Math.random : () => 0;
          memories.current[player.id] = observeTransition(
            memories.current[player.id] ?? {},
            previous,
            next,
            player.id,
            random,
          );
        }
      }

      stateRef.current = next;
      setState(next);
    },
    [seedAll],
  );

  const newMatch = useCallback(
    (next: MatchOptions) => {
      clearTimers();
      const game = createMatch(next);
      seedAll(game);
      burnPlan.current = { window: -1, moves: [] };
      stateRef.current = game;
      setState(game);
    },
    [clearTimers, seedAll],
  );

  useEffect(() => {
    clearTimers();
    const game = state;

    if (game.phase === 'ROUND_OVER' || game.phase === 'MATCH_OVER') return clearTimers;

    // Something is face-up. Cards shown to you wait for a tap; everything
    // else clears itself.
    if (game.reveal) {
      if (game.reveal.viewerId === '*') {
        later(() => dispatch({ type: 'ACK_REVEAL' }), 1900);
      } else if (game.reveal.viewerId !== HUMAN_ID) {
        later(() => dispatch({ type: 'ACK_REVEAL' }), 850);
      }
      return clearTimers;
    }

    if (game.phase === 'BURN_WINDOW' && game.burn) {
      // Each bot decides once per window, so it cannot re-roll its nerve.
      if (burnPlan.current.window !== game.burn.closesAt) {
        const moves: Array<{ botId: string; slot: number; at: number }> = [];
        for (const player of game.players) {
          if (!player.isBot) continue;
          const move = decideBurn(game, player.id, memories.current[player.id] ?? {});
          if (move && move.type === 'BURN') {
            const quickness = player.difficulty === 'sharp' ? 900 : 1500;
            moves.push({
              botId: player.id,
              slot: move.slot,
              at: Date.now() + 500 + Math.random() * quickness,
            });
          }
        }
        burnPlan.current = { window: game.burn.closesAt, moves };
      }

      for (const move of burnPlan.current.moves) {
        if (game.burn.attempted.includes(move.botId)) continue;
        later(
          () => dispatch({ type: 'BURN', playerId: move.botId, slot: move.slot }),
          move.at - Date.now(),
        );
      }

      later(() => dispatch({ type: 'CLOSE_BURN', now: Date.now() }), game.burn.closesAt - Date.now());
      return clearTimers;
    }

    const seat = currentPlayer(game);
    if (seat.isBot && (game.phase === 'TURN_START' || game.phase === 'HOLDING' || game.phase === 'POWER')) {
      const move = decide(game, seat.id, memories.current[seat.id] ?? {});
      if (move) later(() => dispatch(move), thinkingTime(game, seat.difficulty));
    }

    return clearTimers;
  }, [state, dispatch, clearTimers, later]);

  useEffect(() => clearTimers, [clearTimers]);

  return {
    state,
    dispatch,
    newMatch,
    /** Everything you have personally been shown this round. */
    yourMemory: memories.current[HUMAN_ID] ?? {},
  };
}

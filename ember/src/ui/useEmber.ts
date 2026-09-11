import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { observeTransition, seedMemory, type BotMemory } from '../../shared/ai';
import { Autoplay } from '../../shared/autoplay';
import { createMatch, HUMAN_ID, reduce, type MatchOptions } from '../../shared/engine';
import type { GameAction, GameState } from '../../shared/types';
import { viewFor, type TableView } from '../../shared/view';

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
  const autoplay = useRef(new Autoplay());

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
      autoplay.current = new Autoplay();
      stateRef.current = game;
      setState(game);
    },
    [clearTimers, seedAll],
  );

  useEffect(() => {
    clearTimers();
    // The bots, the reveal timers and the burn clock all come from the same
    // place the server uses, so an offline table behaves like an online one.
    for (const move of autoplay.current.movesFor(state, memories.current, [HUMAN_ID])) {
      later(() => dispatch(move.action), move.delayMs);
    }
    return clearTimers;
  }, [state, dispatch, clearTimers, later]);

  useEffect(() => clearTimers, [clearTimers]);

  // The local table renders through the same redaction the server uses, so
  // the UI never holds a card it has no business drawing.
  const view: TableView = useMemo(() => viewFor(state, HUMAN_ID), [state]);

  return {
    state,
    view,
    dispatch,
    newMatch,
    /** Everything you have personally been shown this round. */
    yourMemory: memories.current[HUMAN_ID] ?? {},
  };
}

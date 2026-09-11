/**
 * What is being said at the table right now.
 *
 * A held list of the last few things anyone sent, each dropping out on its own
 * after a few seconds. The online table fills it from the socket; a table of
 * bots fills it from what just happened in front of them.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import type { ExpressionId } from '../../shared/expressions';
import type { LogEntry } from '../../shared/types';
import type { TableView } from '../../shared/view';

export interface Said {
  key: string;
  fromId: string;
  targetId: string | null;
  id: ExpressionId;
  at: number;
}

/** How long a bubble or a thrown emoji stays on screen. */
export const SAID_MS = 3000;

let sequence = 0;

export function useTalk() {
  const [said, setSaid] = useState<Said[]>([]);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());

  const say = useCallback((fromId: string, id: ExpressionId, targetId: string | null = null) => {
    const key = `said-${(sequence += 1)}`;
    setSaid((current) => [...current, { key, fromId, targetId, id, at: Date.now() }]);
    const timer = setTimeout(() => {
      timers.current.delete(timer);
      setSaid((current) => current.filter((entry) => entry.key !== key));
    }, SAID_MS);
    timers.current.add(timer);
  }, []);

  const hush = useCallback(() => {
    for (const timer of timers.current) clearTimeout(timer);
    timers.current.clear();
    setSaid([]);
  }, []);

  useEffect(() => {
    const held = timers.current;
    return () => {
      for (const timer of held) clearTimeout(timer);
      held.clear();
    };
  }, []);

  return { said, say, hush };
}

/* ------------------------------------------------------------------ */
/* bots with something to say                                          */
/* ------------------------------------------------------------------ */

/** What a bot might come out with when a particular thing happens. */
const REACTIONS: Partial<Record<LogEntry['key'], ExpressionId[]>> = {
  knocked: ['wow', 'think', 'notThatLucky'],
  knock_stuck: ['clap', 'wellPlayed', 'goat', 'salute'],
  knock_missed: ['laugh', 'clown', 'notThatLucky', 'skull'],
  burned: ['fire', 'nice', 'brain'],
  burned_theirs: ['fire', 'cool', 'eyes', 'watchThis'],
  misfire: ['laugh', 'skull', 'oops'],
  misfire_theirs: ['laugh', 'clown'],
  ash_out: ['wow', 'clap', 'goat'],
  ember: ['cool', 'fire', 'eyes'],
  looked: ['eyes', 'didntSee'],
  blind_swap: ['think', 'didntSee', 'memory'],
};

/** What they say when you have been staring at your cards for a while. */
const NUDGES: ExpressionId[] = ['sleep', 'yourTurn', 'sleeping', 'teaTime'];

/** How long you may think before somebody mentions it. */
const PATIENCE_MS = 14_000;

/**
 * Gives the bots at an offline table something to say.
 *
 * They react to what just happened rather than at random, which is the
 * difference between a table with people at it and a screen with timers on
 * it. A reaction lands a beat late, the way a person's would, and any one bot
 * keeps quiet for a while after speaking.
 */
export function useBotChatter({
  view,
  say,
  enabled = true,
}: {
  view: TableView;
  say: (fromId: string, id: ExpressionId, targetId?: string | null) => void;
  enabled?: boolean;
}) {
  const lastLogId = useRef<number>(-1);
  const spokeAt = useRef<Record<string, number>>({});
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  const nudged = useRef<string>('');

  useEffect(() => {
    const held = timers.current;
    return () => {
      for (const timer of held) clearTimeout(timer);
      held.clear();
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const entry = view.log.length ? view.log[view.log.length - 1] : null;
    if (!entry || entry.id === lastLogId.current) return;
    const first = lastLogId.current < 0;
    lastLogId.current = entry.id;
    if (first) return; // nothing to say about a table you just sat down at

    const choices = REACTIONS[entry.key];
    if (!choices) return;

    // Whoever it happened to keeps their own counsel; the others may comment.
    const onlookers = view.players.filter(
      (player) => player.id !== view.youId && player.id !== entry.actorId,
    );
    if (onlookers.length === 0) return;

    const speaker = onlookers[Math.floor(Math.random() * onlookers.length)];
    const now = Date.now();
    if (now - (spokeAt.current[speaker.id] ?? 0) < 9000) return;
    // Not every hand deserves a comment.
    if (Math.random() > 0.45) return;

    spokeAt.current[speaker.id] = now;
    const id = choices[Math.floor(Math.random() * choices.length)];
    const aimed = entry.actorId && Math.random() < 0.6 ? entry.actorId : null;
    const timer = setTimeout(() => {
      timers.current.delete(timer);
      say(speaker.id, id, aimed);
    }, 700 + Math.random() * 900);
    timers.current.add(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view.log, enabled]);

  /* ---------------- somebody is waiting on you ---------------- */

  const yourMove =
    view.players[view.turn]?.id === view.youId &&
    (view.phase === 'TURN_START' || view.phase === 'HOLDING' || view.phase === 'POWER');

  useEffect(() => {
    if (!enabled || !yourMove) return;
    // One nudge per turn, however long you take over it.
    const turnKey = `${view.round}:${view.log.length}`;
    if (nudged.current === turnKey) return;

    const rivals = view.players.filter((player) => player.id !== view.youId);
    if (rivals.length === 0) return;

    const timer = setTimeout(() => {
      timers.current.delete(timer);
      nudged.current = turnKey;
      const speaker = rivals[Math.floor(Math.random() * rivals.length)];
      say(speaker.id, NUDGES[Math.floor(Math.random() * NUDGES.length)], view.youId);
    }, PATIENCE_MS + Math.random() * 4000);
    timers.current.add(timer);

    return () => {
      clearTimeout(timer);
      timers.current.delete(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yourMove, view.round, view.log.length, enabled]);
}

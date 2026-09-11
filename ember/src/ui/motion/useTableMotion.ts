import { useEffect, useRef, useState } from 'react';

import type { Card } from '../../../shared/types';
import { faceOf, type TableView } from '../../../shared/view';
import { anchorKeys, useAnchors, type Rect } from './anchors';
import type { FlightController } from './MotionLayer';

/**
 * Watches the table and turns what changed into cards moving.
 *
 * The view is all it has to go on, which is the point: it can only animate
 * what the player is allowed to know. A card going into a rival's pile flies
 * to their seat rather than to the exact slot, because which slot it went into
 * is not ours to know.
 */

export interface MotionHints {
  /** The slot you last tapped, so your own swap can be aimed properly. */
  placeSlot?: number;
}

export type TableEvent =
  | 'deal'
  | 'draw'
  | 'throw'
  | 'place'
  | 'burn'
  | 'penalty'
  | 'swap'
  | 'knock'
  | 'round_over';

interface Options {
  view: TableView;
  controller: FlightController;
  hints: React.MutableRefObject<MotionHints>;
  /** Called as each thing happens, for sound and haptics. */
  onEvent?: (event: TableEvent) => void;
  enabled?: boolean;
}

export function useTableMotion({ view, controller, hints, onEvent, enabled = true }: Options) {
  const anchors = useAnchors();
  const previous = useRef<TableView | null>(null);
  /** The discard keeps showing its old top until the new one lands on it. */
  const [heldTop, setHeldTop] = useState<Card | null>(null);
  const pendingToDiscard = useRef(0);

  useEffect(() => {
    const prev = previous.current;
    previous.current = view;
    if (!enabled) return;

    // Anchors are measured after the browser or the platform has laid the
    // table out, so the diff waits a beat for the new positions. It is not
    // cancelled on cleanup: the move happened, and it should still be shown.
    const timer = setTimeout(() => run(prev), prev ? 40 : 140);
    return () => clearTimeout(timer);

    function run(prev: TableView | null) {

    const at = (...keys: Array<string | undefined>) => anchors.first(...keys);
    const seatOf = (playerId: string) =>
      playerId === view.youId ? anchorKeys.hand : anchorKeys.seat(playerId);

    /** A card-sized box in the middle of something bigger. */
    const centred = (rect: Rect, size: number): Rect => ({
      x: rect.x + rect.width / 2 - size / 2,
      y: rect.y + rect.height / 2 - (size * 1.45) / 2,
      width: size,
      height: size * 1.45,
    });

    // A card is the size of a card wherever it is going. Without this, a card
    // aimed at a whole seat would arrive the size of the seat.
    const cardSize = at(anchorKeys.stock)?.width ?? 60;

    /** Where a card lands in someone's pile — the exact slot if it is known. */
    const landing = (playerId: string, index: number): Rect | undefined => {
      const exact = at(anchorKeys.slot(playerId, index));
      if (exact) return exact;
      const seat = at(anchorKeys.seat(playerId));
      return seat ? centred(seat, cardSize) : undefined;
    };

    /** Where a player holds a card mid-turn. */
    const holding = (playerId: string): Rect | undefined => {
      const exact = at(seatOf(playerId));
      if (!exact) return undefined;
      return playerId === view.youId ? exact : centred(exact, cardSize);
    };

    const toDiscard = (from: Rect, card: Card | null, options: Partial<Parameters<typeof controller.fly>[0]> = {}) => {
      const target = at(anchorKeys.discard);
      if (!target) return;
      pendingToDiscard.current += 1;
      setHeldTop(prev?.discardTop ?? null);
      controller.fly({
        from,
        to: target,
        card,
        faceUp: true,
        flip: true,
        arc: 26,
        durationMs: 420,
        toKey: anchorKeys.discard,
        ...options,
      });
    };

    /* ---------------- a fresh deal ---------------- */
    if (!prev || view.round !== prev.round) {
      const stock = at(anchorKeys.stock);
      if (stock) {
        let order = 0;
        const depth = Math.max(...view.players.map((player) => player.slots.length));
        for (let index = 0; index < depth; index++) {
          for (const player of view.players) {
            const target = landing(player.id, index);
            if (!target || !player.slots[index]) continue;
            controller.fly({
              from: stock,
              to: target,
              card: null,
              faceUp: false,
              durationMs: 300,
              delayMs: order * 55,
              arc: 14,
            });
            order += 1;
          }
        }
        if (order > 0) onEvent?.('deal');
      }
      return;
    }

    /* ---------------- drawing ---------------- */
    if (prev.phase !== 'HOLDING' && view.phase === 'HOLDING') {
      const actor = view.players[view.turn];
      const source = view.heldFromDiscard ? anchorKeys.discard : anchorKeys.stock;
      const from = at(source);
      const to = holding(actor.id);
      if (from && to) {
        controller.fly({
          from,
          to,
          card: faceOf(view.held),
          faceUp: view.held?.kind === 'face',
          flip: view.held?.kind === 'face' && !view.heldFromDiscard,
          arc: 18,
          durationMs: 340,
          toKey: seatOf(actor.id),
        });
        onEvent?.('draw');
      }
    }

    /* ---------------- putting it down ---------------- */
    if (prev.phase === 'HOLDING' && view.phase !== 'HOLDING') {
      const actor = prev.players[prev.turn];
      const top = view.discardTop;
      const wasHolding = faceOf(prev.held);
      const handRect = holding(actor.id);
      const threwTheHeldCard = top && wasHolding && top.id === wasHolding.id;

      if (top && !threwTheHeldCard) {
        // A swap: the card in hand went into the pile, and the one it replaced
        // came out onto the discard.
        const slotRect =
          actor.id === view.youId && hints.current.placeSlot != null
            ? landing(actor.id, hints.current.placeSlot)
            : holding(actor.id);
        if (handRect && slotRect) {
          controller.fly({
            from: handRect,
            to: slotRect,
            card: null,
            faceUp: false,
            durationMs: 320,
            arc: 12,
          });
          toDiscard(slotRect, top, { delayMs: 90 });
          onEvent?.('place');
        }
      } else if (top && handRect) {
        toDiscard(handRect, top);
        onEvent?.('throw');
      }
      hints.current.placeSlot = undefined;
    }

    /* ---------------- burning, penalties, swaps ---------------- */
    for (const player of view.players) {
      const before = prev.players.find((entry) => entry.id === player.id);
      if (!before) continue;

      player.slots.forEach((slot, index) => {
        const was = before.slots[index];
        if (!was) {
          // The pile grew: a penalty card, or one forced on them by a joker.
          const stock = at(anchorKeys.stock);
          const target = landing(player.id, index);
          if (stock && target) {
            controller.fly({ from: stock, to: target, card: null, faceUp: false, arc: 16 });
            onEvent?.('penalty');
          }
          return;
        }
        if (slot.kind === 'burned' && was.kind !== 'burned') {
          const source = landing(player.id, index);
          if (source) {
            controller.burst(source);
            toDiscard(source, view.discardTop, { arc: 46, spin: true, durationMs: 480 });
            onEvent?.('burn');
          }
        }
      });
    }

    // A blind swap: two cards cross the table without either being seen.
    const wasSwapping = prev.power && prev.power.picked.length === 2;
    if (wasSwapping && !view.power) {
      const [one, two] = prev.power!.picked;
      const a = landing(one.playerId, one.slot);
      const b = landing(two.playerId, two.slot);
      if (a && b) {
        controller.fly({ from: a, to: b, card: null, faceUp: false, arc: 34, durationMs: 460 });
        controller.fly({ from: b, to: a, card: null, faceUp: false, arc: -34, durationMs: 460 });
        onEvent?.('swap');
      }
    }

    /* ---------------- the loud moments ---------------- */
    if (!prev.knockerId && view.knockerId) onEvent?.('knock');
    if (prev.phase !== 'ROUND_OVER' && prev.phase !== 'MATCH_OVER' &&
        (view.phase === 'ROUND_OVER' || view.phase === 'MATCH_OVER')) {
      onEvent?.('round_over');
    }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  /** Clears the held-back discard once everything has landed on it. */
  const onLanded = (toKey?: string) => {
    if (toKey !== anchorKeys.discard) return;
    pendingToDiscard.current = Math.max(0, pendingToDiscard.current - 1);
    if (pendingToDiscard.current === 0) setHeldTop(null);
  };

  return {
    /** What the discard should show right now — the old top while one is in the air. */
    discardTop: pendingToDiscard.current > 0 && heldTop ? heldTop : view.discardTop,
    onLanded,
  };
}

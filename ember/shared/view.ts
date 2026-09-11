/**
 * What one player is allowed to see.
 *
 * The server holds the whole game state and never sends it anywhere. Each
 * player gets a TableView built here instead, in which a card they have not
 * earned the right to see carries no rank, no suit and no value — not a value
 * marked "hidden", but no value at all. The local game renders through the
 * same function, so there is exactly one path to the table and it is the
 * redacted one.
 */

import { currentPlayer, revealFor } from './engine';
import type {
  BurnWindow,
  Card,
  GameAction,
  GameConfig,
  GameState,
  LogEntry,
  Phase,
  PowerState,
  Reveal,
  RoundResult,
} from './types';

export type SlotView =
  /** A card that was burned away. The space stays, the card is gone. */
  | { kind: 'burned' }
  /** Face down, as far as this viewer is concerned. */
  | { kind: 'hidden' }
  | { kind: 'face'; card: Card };

export interface PlayerView {
  id: string;
  name: string;
  isBot: boolean;
  matchScore: number;
  slots: SlotView[];
  /** Online only: false while a player is away and a bot is covering. */
  connected: boolean;
}

export interface TableView {
  youId: string;
  players: PlayerView[];
  /** Index into `players` of whoever is acting. */
  turn: number;
  phase: Phase;
  round: number;
  stockCount: number;
  discardTop: Card | null;
  /** The card in the acting player's hand — only ever a face for its holder. */
  held: SlotView | null;
  heldFromDiscard: boolean;
  power: PowerState | null;
  reveal: Reveal | null;
  burn: BurnWindow | null;
  knockerId: string | null;
  /** How many opening looks this viewer still has. */
  openingPeeksLeft: number;
  result: RoundResult | null;
  matchWinnerId: string | null;
  log: LogEntry[];
  config: GameConfig;
}

function showdown(phase: Phase): boolean {
  return phase === 'ROUND_OVER' || phase === 'MATCH_OVER';
}

/** Can `viewer` see the card in `playerId`'s slot right now? */
export function canSee(
  state: GameState,
  viewerId: string,
  playerId: string,
  slot: number,
): boolean {
  if (showdown(state.phase)) return true;
  return state.reveals.some(
    (reveal) =>
      (reveal.viewerId === viewerId || reveal.viewerId === '*') &&
      reveal.targets.some((target) => target.playerId === playerId && target.slot === slot),
  );
}

export function viewFor(
  state: GameState,
  viewerId: string,
  connected: Record<string, boolean> = {},
): TableView {
  const players: PlayerView[] = state.players.map((player) => ({
    id: player.id,
    name: player.name,
    isBot: player.isBot,
    matchScore: player.matchScore,
    connected: connected[player.id] ?? true,
    slots: player.slots.map((card, slot) => {
      if (!card) return { kind: 'burned' } as SlotView;
      if (canSee(state, viewerId, player.id, slot)) return { kind: 'face', card };
      return { kind: 'hidden' } as SlotView;
    }),
  }));

  const holder = state.players[state.turn];
  const held: SlotView | null = state.held
    ? holder.id === viewerId || showdown(state.phase)
      ? { kind: 'face', card: state.held }
      : { kind: 'hidden' }
    : null;

  return {
    youId: viewerId,
    players,
    turn: state.turn,
    phase: state.phase,
    round: state.round,
    stockCount: state.stock.length,
    discardTop: state.discard.length ? state.discard[state.discard.length - 1] : null,
    held,
    heldFromDiscard: state.heldFromDiscard,
    power: state.power,
    // Only the card meant for this pair of eyes, never anyone else's look.
    reveal: revealFor(state, viewerId) ?? null,
    burn: state.burn,
    knockerId: state.knockerId,
    openingPeeksLeft: state.openingPeeksLeft[viewerId] ?? 0,
    result: state.result,
    matchWinnerId: state.matchWinnerId,
    log: state.log,
    config: state.config,
  };
}

/* ------------------------------------------------------------------ */
/* authorisation                                                       */
/* ------------------------------------------------------------------ */

/**
 * Whether a player is allowed to send this action. The reducer already
 * refuses moves that break the rules; this is the separate question of
 * whether it is *your* move to make.
 */
export function canAct(state: GameState, playerId: string, action: GameAction): boolean {
  switch (action.type) {
    // Anyone may burn, which is the whole tension of the burn window.
    case 'BURN':
      return action.playerId === playerId && state.phase === 'BURN_WINDOW';

    case 'OPENING_PEEK':
      return action.playerId === playerId && state.phase === 'OPENING_PEEK';

    // Only the person being shown something may put it away, and a card shown
    // to the whole table is cleared by the server's clock instead.
    case 'ACK_REVEAL':
      return (
        action.playerId === playerId &&
        state.reveals.some((reveal) => reveal.viewerId === playerId)
      );

    // Driven by the server's timers, never by a client.
    case 'CLOSE_BURN':
    case 'NEXT_ROUND':
      return false;

    default:
      return currentPlayer(state).id === playerId;
  }
}

/** The view a spectator or log would get: everything hidden that should be. */
export function publicView(state: GameState): TableView {
  return viewFor(state, '__nobody__');
}

/* ------------------------------------------------------------------ */
/* helpers shared by both tables                                       */
/* ------------------------------------------------------------------ */

export function youIn(view: TableView): PlayerView | undefined {
  return view.players.find((player) => player.id === view.youId);
}

export function actingPlayer(view: TableView): PlayerView {
  return view.players[view.turn];
}

export function faceOf(slot: SlotView | null | undefined): Card | null {
  return slot && slot.kind === 'face' ? slot.card : null;
}

/** Totals are only meaningful once the cards are down. */
export function visibleTotal(player: PlayerView): number | null {
  let total = 0;
  for (const slot of player.slots) {
    if (slot.kind === 'hidden') return null;
    if (slot.kind === 'face') total += slot.card.value;
  }
  return total;
}

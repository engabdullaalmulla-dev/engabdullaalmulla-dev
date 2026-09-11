/**
 * EMBER — core type definitions.
 *
 * Everything in `src/game` is pure data + pure functions. No React, no React
 * Native, no timers. That keeps the rules testable from plain node.
 */

export type Suit = 'S' | 'H' | 'D' | 'C';

export type Rank =
  | 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10'
  | 'J' | 'Q' | 'K' | 'JOKER';

/** The action a card triggers when you throw it away instead of keeping it. */
export type Power =
  | 'PEEK'      // 7, 8   — look at one of your own cards
  | 'SPY'       // 9, 10  — look at one card belonging to a rival
  | 'SWAP'      // J, Q   — blind-swap one of yours with one of theirs
  | 'LOOK_SWAP' // black K — look at a rival's card, then swap it if you like
  | 'EMBER';    // Joker  — a rival takes a card from the stock

export interface Card {
  id: string;
  rank: Rank;
  suit: Suit | null;
  /** Point value. Lower is better; you want the smallest pile at the end. */
  value: number;
  power: Power | null;
}

/** A place in a player's pile. `null` means the card there was burned away. */
export type Slot = Card | null;

export type Difficulty = 'easy' | 'normal' | 'sharp';

export interface Player {
  id: string;
  name: string;
  isBot: boolean;
  difficulty: Difficulty;
  slots: Slot[];
  /** Running total across the whole match. Lowest wins. */
  matchScore: number;
}

export type Phase =
  /** Opening look: every player memorises two of their own cards. */
  | 'OPENING_PEEK'
  /** Current player may knock, draw from the stock, or take the discard. */
  | 'TURN_START'
  /** Current player is holding a card and must place or throw it. */
  | 'HOLDING'
  /** A power is resolving and needs one or more targets. */
  | 'POWER'
  /** A card just hit the discard; anyone may burn a match. */
  | 'BURN_WINDOW'
  | 'ROUND_OVER'
  | 'MATCH_OVER';

/**
 * A card that is face-up for exactly one player, until they put it away.
 * `viewerId` is '*' for a card the whole table saw, such as a misfired burn.
 * Several can be open at once — at an online table everyone takes their
 * opening look at the same time.
 */
export interface Reveal {
  viewerId: string;
  targets: Array<{ playerId: string; slot: number }>;
  /** Why it is being shown — drives the wording in the UI. */
  reason: 'opening' | 'peek' | 'spy' | 'look_swap' | 'failed_burn';
}

export interface PowerState {
  kind: Power;
  /** Targets picked so far, in order. */
  picked: Array<{ playerId: string; slot: number }>;
}

export interface BurnWindow {
  /** Rank sitting on top of the discard when the window opened. */
  rank: Rank;
  /** Ends at this wall-clock time. The UI closes it; the engine only checks. */
  closesAt: number;
  /** Players who already tried this window, so bots do not spam it. */
  attempted: string[];
}

export interface RoundResult {
  totals: Record<string, number>;
  /** What each player actually adds to their match score. */
  scored: Record<string, number>;
  knockerId: string | null;
  knockSucceeded: boolean;
  /** Set when someone emptied their pile entirely. */
  ashOutId: string | null;
  winnerId: string;
}

export interface LogEntry {
  id: number;
  text: string;
  /** Tone used for colouring the feed. */
  kind: 'info' | 'good' | 'bad' | 'hot';
}

export interface GameState {
  players: Player[];
  /** Index into `players`. */
  turn: number;
  phase: Phase;
  stock: Card[];
  discard: Card[];
  /** Card currently in the acting player's hand, mid-turn. */
  held: Card | null;
  /** True when `held` came off the discard pile (its power cannot be used). */
  heldFromDiscard: boolean;
  power: PowerState | null;
  /** At most one entry per viewer. */
  reveals: Reveal[];
  burn: BurnWindow | null;
  knockerId: string | null;
  /** Turns already taken since the knock. The round ends at players-1. */
  turnsSinceKnock: number;
  round: number;
  result: RoundResult | null;
  matchWinnerId: string | null;
  /** Slots each player still has to choose during the opening peek. */
  openingPeeksLeft: Record<string, number>;
  log: LogEntry[];
  logSeq: number;
  rng: number;
  config: GameConfig;
}

export interface GameConfig {
  /** Cards dealt to each player at the start of a round. */
  handSize: number;
  /** Cards each player may memorise before play begins. */
  openingPeeks: number;
  /** Added to the knocker's total when the knock fails. */
  knockPenalty: number;
  /** Match ends once any player reaches this. Lowest total wins. */
  targetScore: number;
  /** How long the burn window stays open, in milliseconds. */
  burnWindowMs: number;
}

export type GameAction =
  | { type: 'OPENING_PEEK'; playerId: string; slot: number }
  | { type: 'ACK_REVEAL'; playerId: string }
  | { type: 'KNOCK' }
  | { type: 'DRAW_STOCK' }
  | { type: 'DRAW_DISCARD' }
  | { type: 'PLACE'; slot: number }
  | { type: 'THROW'; usePower: boolean }
  | { type: 'POWER_TARGET'; playerId: string; slot: number }
  | { type: 'POWER_DECLINE' }
  | { type: 'BURN'; playerId: string; slot: number }
  | { type: 'CLOSE_BURN'; now: number }
  | { type: 'NEXT_ROUND' };

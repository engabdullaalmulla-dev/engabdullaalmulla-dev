/**
 * Shared types for the two pure engines.
 *
 * Neither engine touches the database, the clock, or the network. Everything
 * they need arrives as an argument and everything they decide comes back as a
 * return value. That is a requirement, not a preference:
 *
 *   - `ranking.md` makes reproducibility an acceptance criterion — same
 *     players, same result, same votes, same answer.
 *   - The weights in `weights.ts` are explicitly meant to be re-tuned against
 *     real games (open questions R6, R7, B1). You can only re-tune a model you
 *     can re-run over history.
 *   - The R0 games are recorded on paper. Replaying that spreadsheet through
 *     these functions, before trusting either of them, is the whole reason C8
 *     exists.
 */

export type PlayerId = string;

/** What the rating engine needs to know about someone. */
export interface RatedPlayer {
  id: PlayerId;
  /** Current rating. ~1000 is the bottom of tier 2; each tier is 100 wide. */
  rating: number;
  /** Rated games played. Drives K — see `kFor`. */
  gamesPlayed: number;
  isKeeper?: boolean;
}

/** The host's read, taken as three taps at full time. Never shown to players. */
export type HostRead = 'above' | 'level' | 'below';

export interface GameInput {
  sideA: RatedPlayer[];
  sideB: RatedPlayer[];
  /** Goals. Which side is which matters. */
  score: { a: number; b: number };
  /**
   * Whether the host confirmed this score in Gaffer mode. Margin of victory
   * only counts on a confirmed score — pickup scorelines are disputed often
   * enough that an unconfirmed one adds variance, not information.
   */
  scoreConfirmedByHost: boolean;
  /** Sparse: most players are not flagged either way. */
  hostReads?: Partial<Record<PlayerId, HostRead>>;
  /**
   * The host's calibration weight, 0..1, from their track record. Setting this
   * to 0 must degrade the system to the result alone without errors or gaps —
   * that is an acceptance criterion, and the reason community hosts being
   * useless at scale is survivable.
   */
  hostWeight?: number;
  /** Net teammate votes per player. `votesForFullEffect` votes = the full cap. */
  peerVotes?: Partial<Record<PlayerId, number>>;
  /**
   * A game whose sides were changed at half time scores at half K: the sides
   * that finished are not the sides that were rated.
   */
  rebalancedAtHalfTime?: boolean;
}

/**
 * One player's movement, with every intermediate value kept.
 *
 * The intermediates are not debug output — they are what the post-match screen
 * turns into plain words ("you won as underdogs — that counts for more"), and
 * what lets an old game be re-explained after the weights change.
 */
export interface RatingDelta {
  playerId: PlayerId;
  before: number;
  after: number;
  delta: number;
  /** The blended expectation actually used. */
  expected: number;
  /** Half the blend: this player's own rating against the opposition mean. */
  expectedFromOwnRating: number;
  /** The other half: their side's mean against the opposition mean. */
  expectedFromSide: number;
  k: number;
  marginMultiplier: number;
  /** Signed fraction of |delta| contributed by host read + peer votes. */
  modifier: number;
  /** Machine-readable causes; the UI renders these as sentences. */
  reasons: RatingReason[];
}

export type RatingReason =
  | 'won-as-underdog'
  | 'won-as-favourite'
  | 'lost-as-underdog'
  | 'lost-as-favourite'
  | 'drew'
  | 'more-expected-of-you'
  | 'less-expected-of-you'
  | 'heavy-win'
  | 'heavy-defeat'
  | 'host-read-positive'
  | 'host-read-negative'
  | 'teammates-voted-up'
  | 'teammates-voted-down'
  | 'placement'
  | 'half-time-rebalance';

/** What the balancer needs to know about someone. */
export interface BalancePlayer {
  id: PlayerId;
  rating: number;
  gamesPlayed: number;
  isKeeper?: boolean;
  /** Players who booked together share a crew id. */
  crewId?: string | null;
}

export interface BalanceOptions {
  /**
   * Key `pairKey(a, b)` -> how many of this pair's last four shared games they
   * spent on the same side. Without it the balancer is deterministic and hands
   * the same regulars the same split every week, which is how a weekly game
   * dies of boredom.
   */
  pairHistory?: Map<string, number>;
  /**
   * The sides already published, when re-solving after a late drop. Present
   * means "move as few names as possible" — people have already read the sheet.
   */
  previousSides?: { a: PlayerId[]; b: PlayerId[] } | null;
}

export interface BalanceResult {
  sideA: PlayerId[];
  sideB: PlayerId[];
  /** Gap between the two side means, in rating points, after shrinkage. */
  meanGap: number;
  cost: number;
  breakdown: {
    mean: number;
    best: number;
    spread: number;
    repeatedPairs: number;
    crewPairsHonoured: number;
    playersMoved: number;
  };
  /**
   * True when no legal split gets within `unbalanceableGap`. The host is told
   * in words before kick-off; a confident green tick on a night the balancer
   * knows is lopsided burns the meter permanently.
   */
  unbalanceable: boolean;
  /** Machine-readable facts for the balance meter. */
  reasons: BalanceReason[];
  /** How many splits were evaluated. Exhaustive unless `searchWasExhaustive`. */
  splitsEvaluated: number;
  searchWasExhaustive: boolean;
}

export type BalanceReason =
  | 'dead-even'
  | 'close'
  | 'uneven'
  | 'top-two-split'
  | 'keepers-one-each'
  | 'no-ratings-yet'
  | 'odd-numbers'
  | 'crews-kept-together'
  | 'crew-split';

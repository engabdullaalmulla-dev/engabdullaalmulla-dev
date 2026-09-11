/**
 * Every tunable number in the product, in one file.
 *
 * None of these are derived from real games yet. They are defensible starting
 * points and nothing more, and they live together so they can be re-fitted in
 * one place once there is data — see the open questions each one cites.
 *
 * Because ratings are stored as events rather than state (`schema.sql`), a
 * change here can be replayed over the whole history instead of only applying
 * to games from today onward.
 */

export const RATING = {
  /**
   * How much of the expectation comes from the player's OWN rating rather than
   * their side's mean. 0 = pure team Elo (everyone on a side moves the same
   * amount); 1 = the side is ignored entirely.
   *
   * At 0.5 the stronger player in a side gains less from the same win and
   * loses more from the same defeat, because more was expected of them.
   * Open question R6.
   */
  ownRatingShare: 0.5,

  /** Points per tier. Tier 2 starts at 1000. */
  tierWidth: 100,
  tier2Floor: 1000,
  maxTier: 7,

  /** K by rated games played: converge fast, then settle. */
  kBands: [
    { maxGames: 5, k: 60 },
    { maxGames: 20, k: 32 },
    { maxGames: Infinity, k: 16 },
  ],

  /** A player is "in placement" for this many games — host read counts for more. */
  placementGames: 5,

  /**
   * Margin of victory, applied only to a host-confirmed score.
   *   M = 1 + marginMax * min(|goal difference| - 1, marginCapGoals) / marginCapGoals
   * A one-goal win gets nothing; five goals gets the full bonus; past that it
   * stops counting, so running a score up earns nothing. Open question R7.
   */
  marginMax: 0.15,
  marginCapGoals: 4,

  /** Host read, as a fraction of |delta|, at full calibration weight. */
  hostReadMax: 0.4,
  hostReadMaxDuringPlacement: 0.6,

  /** Teammate votes, as a fraction of |delta|. */
  peerVoteMax: 0.15,
  /** Net votes that produce the full peer effect. */
  votesForFullEffect: 2,

  /**
   * Hard ceiling on the combined modifier. Must stay below 1.0: at 1.0 a
   * modifier could flip the sign of a result, which would mean playing well
   * turned a win into a loss on the ladder. `assertInvariants` enforces it.
   */
  modifierCeiling: 0.9,

  /**
   * Safety rail on a single game's movement, in points.
   *
   * NOTE — this deliberately does NOT implement `ranking.md`'s acceptance
   * criterion "no single game can move a player across a tier boundary". That
   * criterion contradicts the spec's own placement example, where game one
   * takes a new player from 1150 to 1202 and promotes them. A cap that
   * prevented crossing would also freeze anyone sitting just below a boundary.
   *
   * What that criterion is really protecting against is a single bad night
   * demoting someone, and the demotion buffer (`DEMOTION`) is what handles
   * that. This rail only exists to bound a pathological input; at K=60 the
   * largest reachable move is ~93 points, so it never binds in normal play.
   */
  maxDeltaPerGame: 100,

  /** A game rebalanced at half time scores at half K. */
  halfTimeRebalanceKFactor: 0.5,
} as const;

export const DEMOTION = {
  /**
   * Promotions are loud, demotions are silent — and slow. A player must sit
   * this far below the boundary before dropping a tier, so nobody yo-yos.
   */
  bufferPoints: 25,
  /** ...and must have stayed below it for this many rated games. */
  sustainedGames: 3,
} as const;

export const BALANCER = {
  /** Cost weights, all in rating points so they are directly comparable. */
  meanGap: 1.0,
  /** "Have they got the best player?" — how a team sheet is actually read. */
  bestPlayerGap: 0.5,
  /** Top-heavy vs. even. Two sides on one mean are not the same game. */
  spreadGap: 0.3,
  /** Per pair who were on the same side in 3+ of their last 4 shared games. */
  repeatedPair: 4,
  /** Bonus per booked-together pair kept together. Capped, see below. */
  crewPairBonus: 15,
  crewPairsHonouredPerSide: 2,
  /** Largest crew allowed wholly on one side. A fourth would own the night. */
  maxCrewOnOneSide: 2,
  /** Per player moved, when re-solving after a late drop. */
  stickiness: 8,

  /** Pair history looks this far back. */
  pairHistoryWindow: 4,
  /** A pair is "repeated" at or above this many same-side games in the window. */
  repeatedPairThreshold: 3,

  /**
   * Above this mean gap the night is declared unbalanceable and the host is
   * told so in words. Roughly a third of a tier.
   */
  unbalanceableGap: 40,
  /** Below this the meter may say "dead even". */
  deadEvenGap: 10,
  /** Below this it says "close". Above `unbalanceableGap` it says "uneven". */
  closeGap: 20,

  /**
   * Exhaustive search up to this many players. C(22,11)/2 = 352,716 splits,
   * well under a second — and an exhaustive search is provably optimal,
   * reproducible, and explainable when a player asks why they are on this
   * side. Above it, snake-draft seed plus 2-opt.
   */
  exhaustiveUpTo: 22,
  /** Local-search passes for the heuristic path. */
  localSearchPasses: 400,

  /**
   * Odd numbers: the side with the extra player carries this handicap, in
   * rating points, when the gap is computed. Unvalidated — an extra body in a
   * seven-a-side is worth more than in an eleven-a-side, and this ignores
   * that. Open question, revisit with real goal differences.
   */
  oddExtraPlayerPoints: 25,
} as const;

/**
 * Confidence used to shrink a rating toward the group mean before balancing.
 * A player two games in has a rating, but not a reliable one, and feeding it
 * in at face value lets one badly-seeded newcomer wreck the split.
 */
export const CONFIDENCE_BANDS = [
  { maxGames: 0, confidence: 0.3 },
  { maxGames: 5, confidence: 0.5 },
  { maxGames: 20, confidence: 0.8 },
  { maxGames: Infinity, confidence: 1.0 },
] as const;

/**
 * Fails loudly at import time rather than producing quietly wrong ratings.
 * The sign-flip invariant is the one that matters: it is what makes
 * "winning never moves you down" a guarantee instead of a tendency.
 */
export function assertInvariants(): void {
  const maxModifier = RATING.hostReadMaxDuringPlacement + RATING.peerVoteMax;
  if (maxModifier >= 1) {
    throw new Error(
      `Modifiers can reach ${maxModifier}, which could flip the sign of a result. ` +
        'Winning must never move a player down.',
    );
  }
  if (RATING.modifierCeiling >= 1) {
    throw new Error('modifierCeiling must stay below 1.0 — see above.');
  }
  if (RATING.ownRatingShare < 0 || RATING.ownRatingShare > 1) {
    throw new Error('ownRatingShare is a blend weight and must sit in [0, 1].');
  }
}

assertInvariants();

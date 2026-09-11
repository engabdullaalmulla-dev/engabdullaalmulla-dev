/**
 * The rating engine. Pure — see the note in `types.ts`.
 *
 * Three inputs and only three: who you played against, where you already sit,
 * and what happened. Everything else is a correction on top of those.
 *
 * Spec: product/specs/ranking.md
 */

import { RATING, DEMOTION } from './weights.ts';
import type {
  GameInput,
  HostRead,
  PlayerId,
  RatedPlayer,
  RatingDelta,
  RatingReason,
} from './types.ts';

/** Standard Elo expectation. */
export function expectedScore(opponentRating: number, ownRating: number): number {
  return 1 / (1 + Math.pow(10, (opponentRating - ownRating) / 400));
}

export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function kFor(gamesPlayed: number): number {
  for (const band of RATING.kBands) {
    if (gamesPlayed <= band.maxGames) return band.k;
  }
  return RATING.kBands[RATING.kBands.length - 1].k;
}

export function isInPlacement(gamesPlayed: number): boolean {
  return gamesPlayed < RATING.placementGames;
}

/**
 * Margin of victory. A one-goal win in a 6–5 is a coin flip and gets nothing;
 * five goals is real information. Applies symmetrically, so a heavy defeat
 * costs more than a narrow one, and only to a host-confirmed score.
 */
export function marginMultiplier(goalDifference: number, confirmedByHost: boolean): number {
  if (!confirmedByHost) return 1;
  const gd = Math.abs(goalDifference);
  if (gd <= 1) return 1;
  const capped = Math.min(gd - 1, RATING.marginCapGoals);
  return 1 + (RATING.marginMax * capped) / RATING.marginCapGoals;
}

export function tierOf(rating: number): number {
  if (rating < RATING.tier2Floor) return 1;
  const tier = 2 + Math.floor((rating - RATING.tier2Floor) / RATING.tierWidth);
  return Math.min(RATING.maxTier, tier);
}

/** How far through the current tier, 0..1. Tier 1 and tier 7 are open-ended. */
export function progressInTier(rating: number): number {
  const tier = tierOf(rating);
  if (tier === 1 || tier === RATING.maxTier) return 1;
  const floor = RATING.tier2Floor + (tier - 2) * RATING.tierWidth;
  return (rating - floor) / RATING.tierWidth;
}

function hostReadSign(read: HostRead | undefined): number {
  if (read === 'above') return 1;
  if (read === 'below') return -1;
  return 0;
}

function actualScore(own: number, other: number): number {
  if (own > other) return 1;
  if (own < other) return 0;
  return 0.5;
}

/**
 * The whole model, for every player in one game.
 *
 * Order of operations (ranking.md):
 *   1. E   = share·E_you + (1-share)·E_side
 *   2. Δ   = K × (S - E)
 *   3. Δ   = Δ × M                    margin, host-confirmed scores only
 *   4. Δ   = Δ + (host + peer) × |Δ|  modifiers ADD to the magnitude
 *   5. cap
 *
 * Step 4 is where this is easy to get wrong. If the modifiers multiplied the
 * signed delta, a positive host read on a losing night would make the loss
 * BIGGER. Adding a signed fraction of |Δ| instead means a good read always
 * pushes upward: a −7.5 becomes −4.5, a +8.5 becomes +11.9.
 */
export function computeDeltas(game: GameInput): RatingDelta[] {
  const { sideA, sideB, score } = game;
  if (sideA.length === 0 || sideB.length === 0) {
    throw new Error('Both sides need at least one checked-in player.');
  }

  const hostWeight = clamp(game.hostWeight ?? 0, 0, 1);
  const goalDifference = score.a - score.b;
  const margin = marginMultiplier(goalDifference, game.scoreConfirmedByHost);

  const meanA = mean(sideA.map((p) => p.rating));
  const meanB = mean(sideB.map((p) => p.rating));

  const forSide = (
    players: RatedPlayer[],
    ownMean: number,
    oppMean: number,
    own: number,
    other: number,
  ): RatingDelta[] => {
    const s = actualScore(own, other);
    return players.map((player) =>
      computeOne(player, { s, ownMean, oppMean, margin, goalDifference, hostWeight, game }),
    );
  };

  return [
    ...forSide(sideA, meanA, meanB, score.a, score.b),
    ...forSide(sideB, meanB, meanA, score.b, score.a),
  ];
}

interface OneContext {
  s: number;
  ownMean: number;
  oppMean: number;
  margin: number;
  goalDifference: number;
  hostWeight: number;
  game: GameInput;
}

function computeOne(player: RatedPlayer, ctx: OneContext): RatingDelta {
  const { s, ownMean, oppMean, margin, hostWeight, game } = ctx;

  // 1 — expectation, blended. Half from this player against the opposition,
  // half from their side. Because the balancer makes sides even by design,
  // E_side sits near 0.5 most weeks and E_own is what actually varies, so the
  // blend is mostly a statement about the player — which is the point.
  const expectedFromOwnRating = expectedScore(oppMean, player.rating);
  const expectedFromSide = expectedScore(oppMean, ownMean);
  const share = RATING.ownRatingShare;
  const expected = share * expectedFromOwnRating + (1 - share) * expectedFromSide;

  // 2 — base move.
  let k = kFor(player.gamesPlayed);
  if (game.rebalancedAtHalfTime) k *= RATING.halfTimeRebalanceKFactor;
  const base = k * (s - expected);

  // 3 — margin.
  const afterMargin = base * margin;

  // 4 — modifiers, added to the magnitude so they can never flip the sign.
  const placement = isInPlacement(player.gamesPlayed);
  const hostCap = placement ? RATING.hostReadMaxDuringPlacement : RATING.hostReadMax;
  const hostComponent = hostReadSign(game.hostReads?.[player.id]) * hostCap * hostWeight;

  const netVotes = game.peerVotes?.[player.id] ?? 0;
  const peerComponent =
    clamp(netVotes / RATING.votesForFullEffect, -1, 1) * RATING.peerVoteMax;

  const modifier = clamp(
    hostComponent + peerComponent,
    -RATING.modifierCeiling,
    RATING.modifierCeiling,
  );

  const withModifier = afterMargin + modifier * Math.abs(afterMargin);

  // 5 — safety rail (see the note on maxDeltaPerGame).
  const delta = clamp(withModifier, -RATING.maxDeltaPerGame, RATING.maxDeltaPerGame);

  return {
    playerId: player.id,
    before: player.rating,
    after: player.rating + delta,
    delta,
    expected,
    expectedFromOwnRating,
    expectedFromSide,
    k,
    marginMultiplier: margin,
    modifier,
    reasons: reasonsFor({ s, expected, expectedFromOwnRating, expectedFromSide, ctx, player, modifier, hostComponent, peerComponent, placement }),
  };
}

function reasonsFor(a: {
  s: number;
  expected: number;
  expectedFromOwnRating: number;
  expectedFromSide: number;
  ctx: OneContext;
  player: RatedPlayer;
  modifier: number;
  hostComponent: number;
  peerComponent: number;
  placement: boolean;
}): RatingReason[] {
  const out: RatingReason[] = [];
  const underdog = a.expected < 0.5;

  if (a.s === 1) out.push(underdog ? 'won-as-underdog' : 'won-as-favourite');
  else if (a.s === 0) out.push(underdog ? 'lost-as-underdog' : 'lost-as-favourite');
  else out.push('drew');

  // The player's own expectation against their side's: this is what "more was
  // expected of you" means, and it is the part of the model people feel.
  const gap = a.expectedFromOwnRating - a.expectedFromSide;
  if (gap > 0.03) out.push('more-expected-of-you');
  else if (gap < -0.03) out.push('less-expected-of-you');

  if (a.ctx.margin > 1) {
    out.push(a.s === 1 ? 'heavy-win' : a.s === 0 ? 'heavy-defeat' : 'drew');
  }
  if (a.hostComponent > 0) out.push('host-read-positive');
  else if (a.hostComponent < 0) out.push('host-read-negative');
  if (a.peerComponent > 0) out.push('teammates-voted-up');
  else if (a.peerComponent < 0) out.push('teammates-voted-down');
  if (a.placement) out.push('placement');
  if (a.ctx.game.rebalancedAtHalfTime) out.push('half-time-rebalance');

  return out;
}

/**
 * Whether a drop below a tier boundary should actually demote.
 *
 * Crossing downward needs a sustained drop past a buffer, so nobody yo-yos
 * around a boundary — and it fires no notification when it does happen.
 * Being told you have got worse at football is a churn event, not a feature.
 *
 * @param recentRatings most recent last, including the rating just written.
 */
export function shouldDemote(currentTier: number, recentRatings: number[]): boolean {
  if (recentRatings.length < DEMOTION.sustainedGames) return false;
  const window = recentRatings.slice(-DEMOTION.sustainedGames);
  const boundary = RATING.tier2Floor + (currentTier - 2) * RATING.tierWidth;
  return window.every((r) => r <= boundary - DEMOTION.bufferPoints);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Rounds for storage. Ratings are whole numbers everywhere they are shown. */
export function applyDelta(before: number, delta: number): number {
  return Math.round(before + delta);
}

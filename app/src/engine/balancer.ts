/**
 * The balancer. Pure — see the note in `types.ts`.
 *
 * It optimises for two objectives that are not the same thing: the game being
 * close, and the sheet READING as fair. A split can be mathematically perfect
 * and still look like a stitch-up — the two best players together, four mates
 * on one side, or the identical teams as last Thursday.
 *
 * Spec: product/specs/balancer.md
 */

import { BALANCER, CONFIDENCE_BANDS } from './weights.ts';
import type {
  BalanceOptions,
  BalancePlayer,
  BalanceReason,
  BalanceResult,
  PlayerId,
} from './types.ts';

/** Stable key for a pair, order-independent. */
export function pairKey(a: PlayerId, b: PlayerId): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

function confidenceFor(gamesPlayed: number, isKeeper: boolean): number {
  let index = CONFIDENCE_BANDS.findIndex((band) => gamesPlayed <= band.maxGames);
  if (index === -1) index = CONFIDENCE_BANDS.length - 1;
  // A keeper's rating leans almost entirely on the host read, so it is the
  // least reliable number on the sheet early on: shrink one band harder.
  if (isKeeper) index = Math.max(0, index - 1);
  return CONFIDENCE_BANDS[index].confidence;
}

function stdev(values: number[]): number {
  if (values.length < 2) return 0;
  const m = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + (b - m) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * Balance the sides.
 *
 * Up to `exhaustiveUpTo` players every legal split is enumerated and scored,
 * so the answer is the global minimum of the cost function — provably optimal,
 * reproducible, and explainable. For 7-a-side that is 1,716 splits; there is
 * no reason to reach for a greedy draft and inherit its blind spots.
 */
export function pickSides(
  players: BalancePlayer[],
  options: BalanceOptions = {},
): BalanceResult {
  if (players.length < 2) {
    throw new Error('Need at least two checked-in players to make two sides.');
  }

  const n = players.length;
  const groupMean = players.reduce((a, p) => a + p.rating, 0) / n;

  // Shrink toward the group mean by confidence. With no ratings at all every
  // shrunk rating equals the group mean, every mean gap is zero, and the
  // balancer falls through to keepers, crews and variety with ties broken
  // deterministically. That is the correct cold-start behaviour and it is
  // implemented on purpose, not discovered.
  const shrunk = players.map((p) => {
    const c = confidenceFor(p.gamesPlayed, p.isKeeper ?? false);
    return groupMean + (p.rating - groupMean) * c;
  });

  const sizeA = Math.ceil(n / 2);
  const keeperIndices = players
    .map((p, i) => (p.isKeeper ? i : -1))
    .filter((i) => i >= 0);
  const enforceKeeperSplit = keeperIndices.length === 2;

  // The two strongest are never on the same side. It is the single most
  // visible unfairness on a team sheet, and worth a hard rule even when the
  // top six are within ten points and splitting them is arbitrary — simple
  // and explainable beats subtle.
  const byStrength = shrunk.map((r, i) => ({ r, i })).sort((x, y) => y.r - x.r);
  const topTwo: [number, number] | null =
    n >= 4 ? [byStrength[0].i, byStrength[1].i] : null;

  const crews = new Map<string, number[]>();
  players.forEach((p, i) => {
    if (!p.crewId) return;
    const list = crews.get(p.crewId) ?? [];
    list.push(i);
    crews.set(p.crewId, list);
  });

  const previousSideA = options.previousSides
    ? new Set(options.previousSides.a)
    : null;

  const exhaustive = n <= BALANCER.exhaustiveUpTo;
  const candidates = exhaustive
    ? enumerateSplits(n, sizeA)
    : heuristicSplits(n, sizeA, shrunk);

  let best: { mask: number; cost: number; parts: BalanceResult['breakdown']; meanGap: number } | null =
    null;
  let evaluated = 0;

  for (const mask of candidates) {
    if (!isLegal(mask, n, { topTwo, keeperIndices, enforceKeeperSplit, crews })) continue;
    evaluated++;
    const scored = score(mask, n, shrunk, players, options, previousSideA);
    if (best === null || scored.cost < best.cost) {
      best = { mask, ...scored };
    }
  }

  if (best === null) {
    // Every split violated a hard constraint. Rather than return nothing,
    // drop the soft-ish constraints in the order they can be given up and say
    // so in the reasons, so the host still gets a sheet.
    for (const mask of candidates) {
      if (!isLegal(mask, n, { topTwo, keeperIndices, enforceKeeperSplit: false, crews: new Map() }))
        continue;
      evaluated++;
      const scored = score(mask, n, shrunk, players, options, previousSideA);
      if (best === null || scored.cost < best.cost) best = { mask, ...scored };
    }
  }
  if (best === null) throw new Error('No legal split exists for this squad.');

  const sideA: PlayerId[] = [];
  const sideB: PlayerId[] = [];
  for (let i = 0; i < n; i++) {
    (maskHas(best.mask, i) ? sideA : sideB).push(players[i].id);
  }

  const unbalanceable = best.meanGap > BALANCER.unbalanceableGap;

  return {
    sideA,
    sideB,
    meanGap: best.meanGap,
    cost: best.cost,
    breakdown: best.parts,
    unbalanceable,
    reasons: reasonsFor({
      meanGap: best.meanGap,
      unbalanceable,
      hasRatings: shrunk.some((r) => Math.abs(r - groupMean) > 0.5),
      topTwoSplit: topTwo !== null,
      keepersSplit: enforceKeeperSplit,
      odd: n % 2 === 1,
      crewsHonoured: best.parts.crewPairsHonoured > 0,
      crewSplit: [...crews.values()].some((c) => c.length > BALANCER.maxCrewOnOneSide),
    }),
    splitsEvaluated: evaluated,
    searchWasExhaustive: exhaustive,
  };
}

function maskHas(mask: number, i: number): boolean {
  return (mask & (1 << i)) !== 0;
}

function popcount(mask: number): number {
  let count = 0;
  let m = mask;
  while (m) {
    m &= m - 1;
    count++;
  }
  return count;
}

/**
 * Every distinct split. For even n, a subset and its complement are the same
 * split, so player 0 is pinned to side A to halve the space. For odd n the
 * sides differ in size and so are distinguishable — every size-`sizeA` subset
 * is its own split, which is exactly "either side may carry the extra".
 */
function* enumerateSplits(n: number, sizeA: number): Generator<number> {
  const even = n % 2 === 0;
  const total = 1 << n;
  for (let mask = 0; mask < total; mask++) {
    if (even && !maskHas(mask, 0)) continue;
    if (popcount(mask) !== sizeA) continue;
    yield mask;
  }
}

/** Above the exhaustive limit: snake-draft seed, then 2-opt swaps. */
function* heuristicSplits(n: number, sizeA: number, shrunk: number[]): Generator<number> {
  const order = shrunk.map((r, i) => ({ r, i })).sort((a, b) => b.r - a.r);
  let mask = 0;
  order.forEach((entry, rank) => {
    const toA = rank % 4 === 0 || rank % 4 === 3;
    if (toA && popcount(mask) < sizeA) mask |= 1 << entry.i;
  });
  for (let i = 0; i < n && popcount(mask) < sizeA; i++) mask |= 1 << i;
  yield mask;

  let current = mask;
  for (let pass = 0; pass < BALANCER.localSearchPasses; pass++) {
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (maskHas(current, i) === maskHas(current, j)) continue;
        const swapped = current ^ (1 << i) ^ (1 << j);
        if (popcount(swapped) !== sizeA) continue;
        yield swapped;
      }
    }
    current = mask;
  }
}

function isLegal(
  mask: number,
  n: number,
  ctx: {
    topTwo: [number, number] | null;
    keeperIndices: number[];
    enforceKeeperSplit: boolean;
    crews: Map<string, number[]>;
  },
): boolean {
  if (ctx.topTwo && maskHas(mask, ctx.topTwo[0]) === maskHas(mask, ctx.topTwo[1])) return false;

  if (ctx.enforceKeeperSplit) {
    const [k1, k2] = ctx.keeperIndices;
    if (maskHas(mask, k1) === maskHas(mask, k2)) return false;
  }

  for (const members of ctx.crews.values()) {
    if (members.length <= BALANCER.maxCrewOnOneSide) continue;
    const inA = members.filter((i) => maskHas(mask, i)).length;
    if (inA > BALANCER.maxCrewOnOneSide) return false;
    if (members.length - inA > BALANCER.maxCrewOnOneSide) return false;
  }
  return true;
}

function score(
  mask: number,
  n: number,
  shrunk: number[],
  players: BalancePlayer[],
  options: BalanceOptions,
  previousSideA: Set<PlayerId> | null,
) {
  const a: number[] = [];
  const b: number[] = [];
  const aIdx: number[] = [];
  const bIdx: number[] = [];
  for (let i = 0; i < n; i++) {
    if (maskHas(mask, i)) {
      a.push(shrunk[i]);
      aIdx.push(i);
    } else {
      b.push(shrunk[i]);
      bIdx.push(i);
    }
  }

  let meanA = a.reduce((x, y) => x + y, 0) / a.length;
  let meanB = b.reduce((x, y) => x + y, 0) / b.length;
  // Odd numbers: whoever carries the extra body carries a handicap too.
  if (a.length > b.length) meanA += BALANCER.oddExtraPlayerPoints;
  else if (b.length > a.length) meanB += BALANCER.oddExtraPlayerPoints;

  const meanGap = Math.abs(meanA - meanB);
  const bestGap = Math.abs(Math.max(...a) - Math.max(...b));
  const spreadGapValue = Math.abs(stdev(a) - stdev(b));

  let repeatedPairs = 0;
  const history = options.pairHistory;
  if (history && history.size > 0) {
    for (const side of [aIdx, bIdx]) {
      for (let x = 0; x < side.length; x++) {
        for (let y = x + 1; y < side.length; y++) {
          const shared = history.get(pairKey(players[side[x]].id, players[side[y]].id)) ?? 0;
          if (shared >= BALANCER.repeatedPairThreshold) repeatedPairs++;
        }
      }
    }
  }

  let crewPairsHonoured = 0;
  for (const side of [aIdx, bIdx]) {
    let onThisSide = 0;
    for (let x = 0; x < side.length; x++) {
      for (let y = x + 1; y < side.length; y++) {
        const px = players[side[x]];
        const py = players[side[y]];
        if (px.crewId && px.crewId === py.crewId) onThisSide++;
      }
    }
    crewPairsHonoured += Math.min(onThisSide, BALANCER.crewPairsHonouredPerSide);
  }

  let playersMoved = 0;
  if (previousSideA) {
    for (let i = 0; i < n; i++) {
      const wasInA = previousSideA.has(players[i].id);
      if (wasInA !== maskHas(mask, i)) playersMoved++;
    }
  }

  const cost =
    BALANCER.meanGap * meanGap +
    BALANCER.bestPlayerGap * bestGap +
    BALANCER.spreadGap * spreadGapValue +
    BALANCER.repeatedPair * repeatedPairs -
    BALANCER.crewPairBonus * crewPairsHonoured +
    BALANCER.stickiness * playersMoved;

  return {
    cost,
    meanGap,
    parts: {
      mean: meanGap,
      best: bestGap,
      spread: spreadGapValue,
      repeatedPairs,
      crewPairsHonoured,
      playersMoved,
    },
  };
}

function reasonsFor(a: {
  meanGap: number;
  unbalanceable: boolean;
  hasRatings: boolean;
  topTwoSplit: boolean;
  keepersSplit: boolean;
  odd: boolean;
  crewsHonoured: boolean;
  crewSplit: boolean;
}): BalanceReason[] {
  const out: BalanceReason[] = [];
  if (a.unbalanceable) out.push('uneven');
  else if (a.meanGap <= BALANCER.deadEvenGap) out.push('dead-even');
  else if (a.meanGap <= BALANCER.closeGap) out.push('close');
  else out.push('uneven');

  if (!a.hasRatings) out.push('no-ratings-yet');
  if (a.topTwoSplit) out.push('top-two-split');
  if (a.keepersSplit) out.push('keepers-one-each');
  if (a.odd) out.push('odd-numbers');
  if (a.crewsHonoured) out.push('crews-kept-together');
  if (a.crewSplit) out.push('crew-split');
  return out;
}

/**
 * "Why am I on this side?" — for the asking player only.
 *
 * Two rules this must never break: it never reveals another player's rating
 * or tier, and it never explains a placement by naming someone as the weak
 * one. "We split the strongest players" is sayable; "we put you with Omar to
 * carry him" is the same fact and is not.
 */
export function explainPlacement(
  playerId: PlayerId,
  result: BalanceResult,
  players: BalancePlayer[],
): string[] {
  const lines: string[] = [];
  const me = players.find((p) => p.id === playerId);
  if (!me) return lines;

  const mySide = result.sideA.includes(playerId) ? result.sideA : result.sideB;

  if (me.crewId) {
    const withMe = players.filter(
      (p) => p.id !== playerId && p.crewId === me.crewId && mySide.includes(p.id),
    );
    if (withMe.length > 0) {
      lines.push(`You booked together, so you're on the same side.`);
    } else {
      lines.push(`Your crew is split tonight — a whole crew on one team is the other team's bad night.`);
    }
  }

  if (result.reasons.includes('top-two-split')) {
    const ranked = [...players].sort((a, b) => b.rating - a.rating);
    if (ranked[0]?.id === playerId || ranked[1]?.id === playerId) {
      lines.push(`You're one of the two strongest here tonight, and those two are always split.`);
    }
  }

  if (me.isKeeper && result.reasons.includes('keepers-one-each')) {
    lines.push(`You're in goal, and each side gets a keeper.`);
  }

  if (result.unbalanceable) {
    lines.push(`Tonight's crowd doesn't split evenly — this is the closest we could get.`);
  } else if (result.reasons.includes('dead-even')) {
    lines.push(`Both sides came out within a fraction of a level of each other.`);
  }

  return lines;
}

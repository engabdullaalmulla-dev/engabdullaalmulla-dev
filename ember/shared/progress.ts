/**
 * Everything a player collects by playing: a rank, a season's points, a title
 * the table can see, and badges for the things worth remembering.
 *
 * All of it is derived here, in one place both the server and the phone can
 * read, so a badge never means one thing on the leaderboard and another on
 * your own profile.
 */

import type { UserStats } from './protocol';

/* ------------------------------------------------------------------ */
/* the ladder                                                          */
/* ------------------------------------------------------------------ */

export const TIERS = ['ash', 'spark', 'ember', 'blaze', 'inferno'] as const;
export type Tier = (typeof TIERS)[number];

/** Where each rank starts. The last one has no ceiling. */
export const TIER_FLOOR: Record<Tier, number> = {
  ash: 0,
  spark: 100,
  ember: 300,
  blaze: 700,
  inferno: 1500,
};

export interface TierStanding {
  tier: Tier;
  /** The rank above, or null at the top of the ladder. */
  next: Tier | null;
  /** Points earned inside the current rank, and how many it spans. */
  into: number;
  span: number;
  /** 0 to 1 across the current rank; 1 once there is nothing above. */
  fraction: number;
  /** Points still to find. Null at the top. */
  toGo: number | null;
}

export function tierFor(points: number): Tier {
  let found: Tier = 'ash';
  for (const tier of TIERS) if (points >= TIER_FLOOR[tier]) found = tier;
  return found;
}

export function standing(points: number): TierStanding {
  const safe = Math.max(0, Math.floor(points));
  const tier = tierFor(safe);
  const index = TIERS.indexOf(tier);
  const next = index + 1 < TIERS.length ? TIERS[index + 1] : null;
  const floor = TIER_FLOOR[tier];
  if (!next) {
    return { tier, next: null, into: safe - floor, span: 0, fraction: 1, toGo: null };
  }
  const span = TIER_FLOOR[next] - floor;
  const into = safe - floor;
  return { tier, next, into, span, fraction: span ? into / span : 1, toGo: span - into };
}

/* ------------------------------------------------------------------ */
/* what a match is worth                                               */
/* ------------------------------------------------------------------ */

/**
 * Points for finishing a match in a given place.
 *
 * Winning is worth a lot, coming last costs a little, and the places in
 * between slide evenly across — so a five-handed table pays out roughly what
 * a two-handed one does for the same finish.
 */
export function matchPoints(placement: number, seats: number): number {
  if (seats < 2) return 0;
  const place = Math.min(Math.max(1, Math.round(placement)), seats);
  return Math.round((40 * (seats - place)) / (seats - 1)) - 8;
}

/* ------------------------------------------------------------------ */
/* seasons                                                             */
/* ------------------------------------------------------------------ */

/**
 * Seasons run a quarter each, so a board is never so old that the people on
 * it stopped playing months ago, and never so short that it resets before
 * anyone has climbed it.
 */
export function seasonOf(at: number = Date.now()): string {
  const date = new Date(at);
  const quarter = Math.floor(date.getUTCMonth() / 3) + 1;
  return `${date.getUTCFullYear()}-Q${quarter}`;
}

export function seasonEndsAt(at: number = Date.now()): number {
  const date = new Date(at);
  const quarter = Math.floor(date.getUTCMonth() / 3);
  const month = (quarter + 1) * 3;
  return Date.UTC(date.getUTCFullYear() + (month > 11 ? 1 : 0), month % 12, 1);
}

/* ------------------------------------------------------------------ */
/* badges                                                              */
/* ------------------------------------------------------------------ */

export const BADGES = [
  'firstMatch',
  'regular',
  'fiveWins',
  'arsonist',
  'pyromaniac',
  'coldKnocks',
  'ashOut',
  'emptyHanded',
  'century',
  'lightFingers',
] as const;
export type BadgeId = (typeof BADGES)[number];

export interface BadgeProgress {
  id: BadgeId;
  have: number;
  need: number;
  earned: boolean;
}

/** Each badge as a count against a target, so a locked one still shows how far off it is. */
const COUNTERS: Record<BadgeId, (stats: UserStats) => { have: number; need: number }> = {
  firstMatch: (s) => ({ have: s.matches, need: 1 }),
  regular: (s) => ({ have: s.matches, need: 25 }),
  fiveWins: (s) => ({ have: s.wins, need: 5 }),
  arsonist: (s) => ({ have: s.burns, need: 10 }),
  pyromaniac: (s) => ({ have: s.burns, need: 100 }),
  coldKnocks: (s) => ({ have: s.knocksStuck, need: 10 }),
  ashOut: (s) => ({ have: s.ashOuts, need: 1 }),
  emptyHanded: (s) => ({ have: s.bestRound === 0 ? 1 : 0, need: 1 }),
  century: (s) => ({ have: s.rounds, need: 100 }),
  lightFingers: (s) => ({ have: s.bestRound != null && s.bestRound <= 3 ? 1 : 0, need: 1 }),
};

export function badges(stats: UserStats): BadgeProgress[] {
  return BADGES.map((id) => {
    const { have, need } = COUNTERS[id](stats);
    return { id, have: Math.min(have, need), need, earned: have >= need };
  });
}

export function badgesEarned(stats: UserStats): number {
  return badges(stats).filter((badge) => badge.earned).length;
}

/* ------------------------------------------------------------------ */
/* the title under your name                                           */
/* ------------------------------------------------------------------ */

export const TITLES = [
  'newcomer',
  'arsonist',
  'coldHands',
  'lightFingers',
  'tableRunner',
  'sparkThrower',
  'vanisher',
  'steadyHand',
] as const;
export type TitleId = (typeof TITLES)[number];

/**
 * One title, picked from how somebody actually plays rather than how much.
 * The order matters: the first rule that fits wins, so the rarer and more
 * particular habits are checked before the ordinary ones.
 */
export function titleFor(stats: UserStats): TitleId {
  const { matches, wins, rounds, burns, misfires, knocks, knocksStuck, ashOuts, bestRound } = stats;
  if (matches < 3) return 'newcomer';
  if (ashOuts >= 3) return 'vanisher';
  if (burns >= 25 && rounds > 0 && burns / rounds >= 0.4) return 'arsonist';
  if (knocks >= 5 && knocksStuck / knocks >= 0.7) return 'coldHands';
  if (bestRound != null && bestRound <= 3) return 'lightFingers';
  if (matches >= 5 && wins / matches >= 0.5) return 'tableRunner';
  if (misfires >= 10 && misfires > burns) return 'sparkThrower';
  return 'steadyHand';
}

/* ------------------------------------------------------------------ */
/* the mark beside your name                                           */
/* ------------------------------------------------------------------ */

export const AVATAR_SHAPES = ['spade', 'heart', 'diamond', 'club', 'flame', 'star'] as const;
export const AVATAR_COLOURS = ['coral', 'sage', 'navy', 'gold', 'plum', 'teal'] as const;
export type AvatarShape = (typeof AVATAR_SHAPES)[number];
export type AvatarColour = (typeof AVATAR_COLOURS)[number];

export interface Avatar {
  shape: AvatarShape;
  colour: AvatarColour;
}

export function formatAvatar(avatar: Avatar): string {
  return `${avatar.shape}:${avatar.colour}`;
}

/**
 * Reads a stored avatar, falling back to one derived from whatever name or id
 * is to hand — so every seat at the table has a mark of its own, including
 * the bots, and nobody starts out as a blank circle.
 */
export function parseAvatar(stored: string | null | undefined, seed = ''): Avatar {
  const [shape, colour] = String(stored ?? '').split(':');
  if (
    AVATAR_SHAPES.includes(shape as AvatarShape) &&
    AVATAR_COLOURS.includes(colour as AvatarColour)
  ) {
    return { shape: shape as AvatarShape, colour: colour as AvatarColour };
  }
  return avatarFromSeed(seed);
}

export function avatarFromSeed(seed: string): Avatar {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const value = Math.abs(hash);
  return {
    shape: AVATAR_SHAPES[value % AVATAR_SHAPES.length],
    colour: AVATAR_COLOURS[Math.floor(value / AVATAR_SHAPES.length) % AVATAR_COLOURS.length],
  };
}

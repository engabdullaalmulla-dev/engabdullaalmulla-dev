/**
 * A tiny seeded generator (mulberry32). The seed lives inside the game state
 * so a whole match is reproducible from its starting number — which is what
 * makes the rules testable.
 */

export function nextRandom(seed: number): { value: number; seed: number } {
  let t = (seed + 0x6d2b79f5) | 0;
  let r = t;
  r = Math.imul(r ^ (r >>> 15), r | 1);
  r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
  return { value: ((r ^ (r >>> 14)) >>> 0) / 4294967296, seed: t };
}

/** Fisher-Yates, returning a new array plus the advanced seed. */
export function shuffle<T>(items: T[], seed: number): { items: T[]; seed: number } {
  const out = items.slice();
  let s = seed;
  for (let i = out.length - 1; i > 0; i--) {
    const step = nextRandom(s);
    s = step.seed;
    const j = Math.floor(step.value * (i + 1));
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return { items: out, seed: s };
}

export function randomInt(max: number, seed: number): { value: number; seed: number } {
  const step = nextRandom(seed);
  return { value: Math.floor(step.value * max), seed: step.seed };
}

export function pick<T>(items: T[], seed: number): { value: T; seed: number } {
  const step = randomInt(items.length, seed);
  return { value: items[step.value], seed: step.seed };
}

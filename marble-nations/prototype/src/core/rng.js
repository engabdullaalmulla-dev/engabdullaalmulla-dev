// Seeded RNG. Every random decision in the game -- draw, launch impulse, arena
// variation, coin tosses -- comes from one of these, derived from the campaign
// seed by a labelled fork. Nothing in the simulation calls Math.random().

// FNV-1a over a label string, mixed with a numeric seed.
export function hash32(seed, label) {
  let h = (seed >>> 0) ^ 0x811c9dc5;
  const s = String(label);
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x7feb352d);
  h ^= h >>> 15;
  return h >>> 0;
}

export function makeRng(seed) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const r = next;
  r.seed = seed >>> 0;
  r.range = (lo, hi) => lo + (hi - lo) * next();
  r.int = (n) => Math.floor(next() * n);
  r.pick = (arr) => arr[Math.floor(next() * arr.length)];
  r.bool = (p = 0.5) => next() < p;
  // Fisher-Yates, ascending-index variant so the order is stable across engines.
  r.shuffle = (arr) => {
    const out = arr.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(next() * (i + 1));
      const tmp = out[i]; out[i] = out[j]; out[j] = tmp;
    }
    return out;
  };
  // Gaussian-ish via sum of three uniforms: bounded, cheap, no transcendentals.
  r.bell = (mean, spread) => mean + ((next() + next() + next()) / 1.5 - 1) * spread;
  r.fork = (label) => makeRng(hash32(seed, label));
  return r;
}

// Convenience for building a match seed that is reproducible from campaign state.
export function seedFor(campaignSeed, ...parts) {
  return hash32(campaignSeed, parts.join('|'));
}

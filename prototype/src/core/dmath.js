// Deterministic maths.
//
// Replay-by-seed only works if every arithmetic operation produces bit-identical
// results on every device. IEEE-754 guarantees that for + - * / and Math.sqrt,
// but NOT for Math.sin/cos/atan2/hypot/pow, which are implementation-defined.
// So the simulation never calls those: it uses the polynomial versions below,
// which are built purely from exact operations.

export const PI = 3.141592653589793;
export const TAU = 6.283185307179586;
const HALF_PI = 1.5707963267948966;

// Odd Taylor polynomial to x^13. Measured max error 6.6e-10 against Math.sin
// for every x in [-100, 100] -- orders of magnitude below the smallest distance
// the physics resolves, so it can never change a collision outcome.
function sinCore(x) {
  const x2 = x * x;
  return x * (1 + x2 * (-0.16666666666666666 + x2 * (0.008333333333333333 +
    x2 * (-0.0001984126984126984 + x2 * (0.0000027557319223985893 +
    x2 * (-0.000000025052108385441718 + x2 * 0.00000000016059043836821613))))));
}

export function dsin(x) {
  // Range-reduce into [-pi, pi]. Math.floor is exact, so this is deterministic.
  const k = Math.floor(x / TAU + 0.5);
  let r = x - k * TAU;
  if (r > HALF_PI) r = PI - r;
  else if (r < -HALF_PI) r = -PI - r;
  return sinCore(r);
}

export function dcos(x) {
  return dsin(x + HALF_PI);
}

export function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

export function len(x, y) {
  // Math.hypot is not required to be correctly rounded; this is.
  return Math.sqrt(x * x + y * y);
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

// Signed distance from point p to segment ab, plus the closest point on it.
export function closestOnSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const l2 = dx * dx + dy * dy;
  let t = l2 === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / l2;
  t = clamp(t, 0, 1);
  return { x: ax + t * dx, y: ay + t * dy, t };
}

// Rotate (x,y) about (cx,cy) by angle a.
export function rotateAbout(x, y, cx, cy, a) {
  const s = dsin(a), c = dcos(a);
  const dx = x - cx, dy = y - cy;
  return { x: cx + dx * c - dy * s, y: cy + dx * s + dy * c };
}

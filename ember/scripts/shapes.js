/**
 * The shapes the brand is made of, shared by the icon and mark generators.
 *
 * The flame is a hand-drawn outline rather than a formula. Every attempt at
 * "a circle with a taper on top" comes out as a drop of water, because that is
 * exactly what a circle with a taper on top is. Fire needs a bowl at the
 * bottom, a waist, a tip that hooks over, and a second tongue licking up
 * beside it — none of which falls out of an equation.
 *
 * Outlines are given in a 1×1 box centred on the origin, y downwards, listed
 * clockwise from the tip.
 */

/** Catmull-Rom through the control points, closed, sampled smooth. */
function smooth(points, perSegment = 16) {
  const out = [];
  const n = points.length;
  const at = (i) => points[(i + n) % n];
  for (let i = 0; i < n; i++) {
    const [ax, ay] = at(i - 1);
    const [bx, by] = at(i);
    const [cx, cy] = at(i + 1);
    const [dx, dy] = at(i + 2);
    for (let s = 0; s < perSegment; s++) {
      const t = s / perSegment;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push([
        0.5 * (2 * bx + (-ax + cx) * t + (2 * ax - 5 * bx + 4 * cx - dx) * t2 + (-ax + 3 * bx - 3 * cx + dx) * t3),
        0.5 * (2 * by + (-ay + cy) * t + (2 * ay - 5 * by + 4 * cy - dy) * t2 + (-ay + 3 * by - 3 * cy + dy) * t3),
      ]);
    }
  }
  return out;
}

/** Ray casting. The outlines are simple, so this is all the test they need. */
function inside(x, y, poly) {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

/**
 * The same test, but sixteen million times over.
 *
 * A 1024px icon asks about every point of a two-hundred-sided outline, which
 * is slow enough to give up waiting on. The crossings only change when the row
 * changes, so each row is worked out once and then read.
 */
function polygonTest(points) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const [x, y] of points) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  const rows = new Map();
  const crossings = (y) => {
    let xs = rows.get(y);
    if (xs) return xs;
    xs = [];
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const [xi, yi] = points[i];
      const [xj, yj] = points[j];
      if (yi > y !== yj > y) xs.push(((xj - xi) * (y - yi)) / (yj - yi) + xi);
    }
    xs.sort((a, b) => a - b);
    rows.set(y, xs);
    return xs;
  };

  return (x, y) => {
    if (x < minX || x > maxX || y < minY || y > maxY) return false;
    const xs = crossings(y);
    let behind = 0;
    for (let i = 0; i < xs.length && xs[i] <= x; i++) behind += 1;
    return behind % 2 === 1;
  };
}

/** Fire: the main tongue, and a smaller one licking up its left side. */
const FLAME = smooth([
  [0.05, -0.47],
  [0.2, -0.28],
  [0.29, -0.05],
  [0.31, 0.12],
  [0.24, 0.31],
  [0.09, 0.43],
  [-0.06, 0.45],
  [-0.21, 0.37],
  [-0.3, 0.2],
  [-0.3, 0.02],
  [-0.24, -0.14],
  [-0.2, -0.31],
  [-0.12, -0.13],
  [-0.05, -0.28],
]);

/** The same fire with one tongue, for the small sizes where the lick is mud. */
const FLAME_SIMPLE = smooth([
  [0.06, -0.46],
  [0.2, -0.25],
  [0.27, -0.02],
  [0.28, 0.16],
  [0.2, 0.34],
  [0.03, 0.44],
  [-0.14, 0.4],
  [-0.25, 0.26],
  [-0.27, 0.07],
  [-0.21, -0.12],
  [-0.13, -0.29],
  [-0.06, -0.14],
]);

function turn(poly, deg) {
  const a = (deg * Math.PI) / 180;
  return poly.map(([x, y]) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)]);
}

/** An outline placed on a canvas: a predicate on pixel coordinates. */
function placed(poly, cx, cy, size, deg = 0) {
  const points = (deg ? turn(poly, deg) : poly).map(([x, y]) => [cx + x * size, cy + y * size]);
  return polygonTest(points);
}

/** Signed-distance test for a rounded box, as a predicate. */
function roundedBox(cx, cy, hw, hh, r, deg = 0) {
  const a = (-deg * Math.PI) / 180;
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  return (px, py) => {
    const dx = px - cx;
    const dy = py - cy;
    const x = dx * cos - dy * sin;
    const y = dx * sin + dy * cos;
    const qx = Math.abs(x) - (hw - r);
    const qy = Math.abs(y) - (hh - r);
    const ox = Math.max(qx, 0);
    const oy = Math.max(qy, 0);
    return Math.hypot(ox, oy) + Math.min(Math.max(qx, qy), 0) - r <= 0;
  };
}

/**
 * The mark: a playing card with the fire knocked out of the middle of it.
 *
 * Returns a predicate that is true wherever the card's ink is — the flame is a
 * hole, so the mark carries its own background wherever it is put down.
 */
function emblem(size, tilt = -8) {
  const c = size / 2;
  const card = roundedBox(c, c, size * 0.28, size * 0.38, size * 0.065, tilt);
  const fire = placed(FLAME, c, c, size * 0.48, tilt);
  return (x, y) => card(x, y) && !fire(x, y);
}

/** Anti-aliased coverage of a predicate, 0 to 1. */
function coverage(predicate, x, y, samples = 3) {
  let hits = 0;
  for (let sy = 0; sy < samples; sy++) {
    for (let sx = 0; sx < samples; sx++) {
      if (predicate(x + (sx + 0.5) / samples, y + (sy + 0.5) / samples)) hits += 1;
    }
  }
  return hits / (samples * samples);
}

module.exports = {
  smooth,
  inside,
  polygonTest,
  placed,
  turn,
  roundedBox,
  emblem,
  coverage,
  FLAME,
  FLAME_SIMPLE,
};

// A small fixed-step rigid-circle physics world.
//
// Scope is deliberately narrow: circular marbles against line segments, circular
// bumpers, and scripted (kinematic) versions of both. That is everything the
// arenas need, and keeping it small is what makes it auditable and deterministic.
//
// Units are "pitch units"; a standard arena is 100 wide. Time is seconds.

import { dsin, dcos, closestOnSegment, len, TAU } from './dmath.js';

export const STEP = 1 / 120;      // fixed physics timestep
export const MAX_SPEED = 78;      // u/s -- below the tunnelling threshold for r>=1.4

// ---------------------------------------------------------------------------
// Colliders
// ---------------------------------------------------------------------------

export function seg(ax, ay, bx, by, opts = {}) {
  return {
    type: 'seg', ax, ay, bx, by,
    rest: opts.rest ?? 0.86, friction: opts.friction ?? 0.04,
    motion: opts.motion || null, gate: opts.gate || null,
    tag: opts.tag || null, kick: opts.kick || 0, only: opts.only ?? null,
  };
}

export function bumper(x, y, r, opts = {}) {
  return {
    type: 'circle', x, y, r,
    rest: opts.rest ?? 0.98, friction: opts.friction ?? 0.02,
    motion: opts.motion || null, gate: opts.gate || null,
    tag: opts.tag || null, kick: opts.kick || 0, only: opts.only ?? null,
  };
}

export function rot(cx, cy, omega, phase = 0) { return { kind: 'rot', cx, cy, omega, phase }; }
export function osc(dx, dy, amp, period, phase = 0) { return { kind: 'osc', dx, dy, amp, period, phase }; }

// A gate is passable for `openFrac` of each cycle and solid for the rest.
export function gate(period, phase, openFrac) { return { period, phase, openFrac }; }

export function gateOpen(g, t) {
  if (!g) return false;
  let u = (t / g.period + g.phase) % 1;
  if (u < 0) u += 1;
  return u < g.openFrac;
}

// Conservative bounding circle covering every position a collider can occupy.
// Cached on first use, then used to reject most collider/body pairs with one
// squared-distance test.
export function boundOf(c) {
  if (c._b) return c._b;
  let bx, by, br;
  if (c.type === 'seg') {
    bx = (c.ax + c.bx) / 2; by = (c.ay + c.by) / 2;
    br = len(c.bx - c.ax, c.by - c.ay) / 2;
  } else { bx = c.x; by = c.y; br = c.r; }
  const m = c.motion;
  if (m && m.kind === 'rot') {
    const d1 = c.type === 'seg' ? len(c.ax - m.cx, c.ay - m.cy) : len(c.x - m.cx, c.y - m.cy);
    const d2 = c.type === 'seg' ? len(c.bx - m.cx, c.by - m.cy) : d1;
    bx = m.cx; by = m.cy; br = Math.max(d1, d2) + (c.type === 'seg' ? 0 : c.r);
  } else if (m && m.kind === 'osc') {
    br += m.amp;
  }
  c._b = { x: bx, y: by, r: br };
  return c._b;
}

// World geometry of a collider at time t, written into a reusable record so the
// hot loop does no allocation. `v*` fields are the velocity of the material at
// that point, which is what lets moving parts impart momentum.
function poseInto(motion, x, y, t, out, k) {
  if (!motion) { out[k] = x; out[k + 1] = y; out[k + 2] = 0; out[k + 3] = 0; return; }
  if (motion.kind === 'rot') {
    const a = motion.omega * t + motion.phase;
    const s = dsin(a), c = dcos(a);
    const dx = x - motion.cx, dy = y - motion.cy;
    const wx = motion.cx + dx * c - dy * s;
    const wy = motion.cy + dx * s + dy * c;
    out[k] = wx; out[k + 1] = wy;
    out[k + 2] = -motion.omega * (wy - motion.cy);
    out[k + 3] = motion.omega * (wx - motion.cx);
    return;
  }
  const w = TAU / motion.period;
  const off = motion.amp * dsin(w * t + motion.phase * TAU);
  const spd = motion.amp * w * dcos(w * t + motion.phase * TAU);
  out[k] = x + motion.dx * off; out[k + 1] = y + motion.dy * off;
  out[k + 2] = motion.dx * spd; out[k + 3] = motion.dy * spd;
}

// g layout: [ax, ay, avx, avy, bx, by, bvx, bvy] for segments;
//           [x,  y,  vx,  vy,  r,  0,  0,   0 ] for circles.
export function colliderWorld(c, t, out = new Float64Array(8)) {
  if (c.type === 'seg') {
    poseInto(c.motion, c.ax, c.ay, t, out, 0);
    poseInto(c.motion, c.bx, c.by, t, out, 4);
  } else {
    poseInto(c.motion, c.x, c.y, t, out, 0);
    out[4] = c.r;
  }
  return out;
}

// ---------------------------------------------------------------------------
// World
// ---------------------------------------------------------------------------

export function makeBody(x, y, r, opts = {}) {
  return {
    x, y, vx: opts.vx || 0, vy: opts.vy || 0, r,
    m: opts.m ?? 1, rest: opts.rest ?? 0.9,
    id: opts.id ?? 0, alive: true,
    // Per-body constant acceleration. Each marble is driven towards the goal it
    // is attacking, which is what gives the contest intent instead of a random
    // walk. The two drives are exact negatives, so the 180-degree symmetry of
    // the arena is preserved.
    ax: opts.ax || 0, ay: opts.ay || 0,
    trail: [],          // presentation only -- never read by the simulation
    nearFlag: false,
  };
}

export function makeWorld(spec) {
  return {
    t: 0,
    bodies: [],
    colliders: spec.colliders || [],
    gravity: spec.gravity || { x: 0, y: 0 },
    drag: spec.drag ?? 0.22,
    bounds: { w: spec.width, h: spec.height },
    contacts: [],
    _geo: null, _live: null,
  };
}

function resolveSegment(body, c, g, world) {
  const cp = closestOnSegment(body.x, body.y, g[0], g[1], g[4], g[5]);
  let nx = body.x - cp.x, ny = body.y - cp.y;
  let d = len(nx, ny);
  if (d >= body.r) return;
  if (d < 1e-9) {
    const sx = g[4] - g[0], sy = g[5] - g[1];
    const sl = len(sx, sy) || 1;
    nx = -sy / sl; ny = sx / sl; d = 1e-9;
  } else { nx /= d; ny /= d; }

  body.x += nx * (body.r - d);
  body.y += ny * (body.r - d);

  const svx = g[2] + (g[6] - g[2]) * cp.t;
  const svy = g[3] + (g[7] - g[3]) * cp.t;
  const rvx = body.vx - svx, rvy = body.vy - svy;
  const vn = rvx * nx + rvy * ny;
  if (vn >= 0) return;

  const e = body.rest < c.rest ? body.rest : c.rest;
  const jn = -(1 + e) * vn;
  let nvx = rvx + jn * nx, nvy = rvy + jn * ny;
  const tx = -ny, ty = nx;
  const vt = nvx * tx + nvy * ty;
  nvx -= vt * c.friction * tx;
  nvy -= vt * c.friction * ty;

  body.vx = nvx + svx + nx * c.kick;
  body.vy = nvy + svy + ny * c.kick;
  world.contacts.push({ x: cp.x, y: cp.y, nx, ny, force: -vn + c.kick, tag: c.tag, body: body.id });
}

function resolveCircle(body, c, g, world) {
  let nx = body.x - g[0], ny = body.y - g[1];
  let d = len(nx, ny);
  const R = body.r + g[4];
  if (d >= R) return;
  if (d < 1e-9) { nx = 0; ny = -1; d = 1e-9; } else { nx /= d; ny /= d; }
  body.x += nx * (R - d);
  body.y += ny * (R - d);

  const rvx = body.vx - g[2], rvy = body.vy - g[3];
  const vn = rvx * nx + rvy * ny;
  if (vn >= 0) return;
  const e = body.rest < c.rest ? body.rest : c.rest;
  const jn = -(1 + e) * vn;
  body.vx = rvx + jn * nx + g[2] + nx * c.kick;
  body.vy = rvy + jn * ny + g[3] + ny * c.kick;
  world.contacts.push({ x: g[0] + nx * g[4], y: g[1] + ny * g[4], nx, ny, force: -vn + c.kick, tag: c.tag, body: body.id });
}

function resolveBodies(a, b, world) {
  let nx = b.x - a.x, ny = b.y - a.y;
  let d = len(nx, ny);
  const R = a.r + b.r;
  if (d >= R || d < 1e-9) return;
  nx /= d; ny /= d;
  const pen = R - d;
  const total = a.m + b.m;
  a.x -= nx * pen * (b.m / total); a.y -= ny * pen * (b.m / total);
  b.x += nx * pen * (a.m / total); b.y += ny * pen * (a.m / total);

  const rvx = b.vx - a.vx, rvy = b.vy - a.vy;
  const vn = rvx * nx + rvy * ny;
  if (vn >= 0) return;
  const e = a.rest < b.rest ? a.rest : b.rest;
  const j = -(1 + e) * vn / (1 / a.m + 1 / b.m);
  a.vx -= (j / a.m) * nx; a.vy -= (j / a.m) * ny;
  b.vx += (j / b.m) * nx; b.vy += (j / b.m) * ny;
  world.contacts.push({ x: a.x + nx * a.r, y: a.y + ny * a.r, nx, ny, force: -vn, tag: 'marble', body: a.id, other: b.id });
}

export function step(world) {
  const dt = STEP;
  world.contacts.length = 0;
  const t = world.t;
  const cols = world.colliders;

  if (!world._geo || world._geo.length !== cols.length) {
    world._geo = cols.map(() => new Float64Array(8));
    world._live = new Uint8Array(cols.length);
  }

  for (const b of world.bodies) {
    if (!b.alive) continue;
    b.vx += (world.gravity.x + b.ax) * dt;
    b.vy += (world.gravity.y + b.ay) * dt;
    const k = 1 - world.drag * dt;
    b.vx *= k; b.vy *= k;
    const sp = len(b.vx, b.vy);
    if (sp > MAX_SPEED) { b.vx = b.vx / sp * MAX_SPEED; b.vy = b.vy / sp * MAX_SPEED; }
    b.x += b.vx * dt;
    b.y += b.vy * dt;
  }

  // Decide once per tick which colliders are solid and where they are, so the
  // two relaxation passes share the work.
  for (let i = 0; i < cols.length; i++) {
    const c = cols[i];
    if (c.gate && gateOpen(c.gate, t)) { world._live[i] = 0; continue; }
    const bd = boundOf(c);
    let near = 0;
    for (const b of world.bodies) {
      if (!b.alive) continue;
      if (c.only != null && c.only !== b.id) continue;
      const dx = b.x - bd.x, dy = b.y - bd.y, reach = bd.r + b.r + 2;
      if (dx * dx + dy * dy <= reach * reach) { near = 1; break; }
    }
    world._live[i] = near;
    if (near) colliderWorld(c, t, world._geo[i]);
  }

  // Two relaxation passes: enough for stable resting contact without jitter.
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < cols.length; i++) {
      if (!world._live[i]) continue;
      const c = cols[i], g = world._geo[i];
      for (const b of world.bodies) {
        if (!b.alive) continue;
        if (c.only != null && c.only !== b.id) continue;
        if (c.type === 'seg') resolveSegment(b, c, g, world);
        else resolveCircle(b, c, g, world);
      }
    }
    for (let i = 0; i < world.bodies.length; i++) {
      for (let j = i + 1; j < world.bodies.length; j++) {
        const a = world.bodies[i], b = world.bodies[j];
        if (a.alive && b.alive) resolveBodies(a, b, world);
      }
    }
  }

  world.t += dt;
}

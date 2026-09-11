// Arena templates.
//
// Every head-to-head arena obeys three rules, and those rules are what make the
// competition fair without ever touching a nation's abilities:
//
//   1. Top-down, zero gravity. Gravity has a preferred direction and a portrait
//      pitch has two ends, so any gravity arena inherently favours one end.
//   2. Exact 180-degree rotational symmetry about the arena centre. The map
//      (x, y) -> (W - x, H - y) sends the collider set to itself and swaps the
//      two goals. So the whole physical situation of team A maps onto team B's.
//   3. Every per-side random quantity (launch impulse, keeper phase) is drawn
//      i.i.d. from one distribution. Combined with (2) the match is exchangeable
//      in the two teams, so P(A wins) = P(B wins) exactly, by construction.
//
// Difficulty escalation across a tournament therefore changes the *environment*
// -- more moving parts, tighter keepers, more hazards -- and never the teams.

import { seg, bumper, rot, osc, gate } from '../core/physics.js';
import { dsin, dcos, TAU, PI } from '../core/dmath.js';
import { DRIVE } from './tuning.js';

export const W = 100;
export const H = 170;
export const GOAL_LINE = 12;          // distance from each end to the goal line
export const CX = W / 2, CY = H / 2;

// --- symmetry helpers -------------------------------------------------------

const rp = (x, y) => ({ x: W - x, y: H - y });

function rotMotion(m) {
  if (!m) return null;
  if (m.kind === 'rot') { const p = rp(m.cx, m.cy); return rot(p.x, p.y, m.omega, m.phase); }
  return osc(-m.dx, -m.dy, m.amp, m.period, m.phase);
}

function rotCollider(c) {
  if (c.type === 'seg') {
    const a = rp(c.ax, c.ay), b = rp(c.bx, c.by);
    return { ...c, ax: a.x, ay: a.y, bx: b.x, by: b.y, motion: rotMotion(c.motion), only: c.only == null ? null : 1 - c.only };
  }
  const p = rp(c.x, c.y);
  return { ...c, x: p.x, y: p.y, motion: rotMotion(c.motion), only: c.only == null ? null : 1 - c.only };
}

// Add a collider and its 180-degree twin.
function pair(list, c) { list.push(c, rotCollider(c)); return list; }

// A shape that is already its own twin (centred, even-armed) is added once.
function solo(list, c) { list.push(c); return list; }

// Force fields get the same treatment: the twin sits at the rotated point.
function fieldPair(list, f) {
  const m = rp(f.x, f.y);
  const twin = { ...f, x: m.x, y: m.y };
  // A directional field's push vector rotates with it.
  if (f.dirX != null) { twin.dirX = -f.dirX; twin.dirY = -f.dirY; }
  list.push(f, twin);
  return list;
}

export function fieldActive(f, t) {
  if (f.cycle == null) return true;
  let u = (t - f.phase) % f.cycle;
  if (u < 0) u += f.cycle;
  return u < f.onFor;
}

// Does a point lie inside a field's area? Fields are discs by default and
// rectangles when `w`/`h` are given (used for conveyor belts).
export function fieldContains(f, x, y) {
  if (f.w != null) return Math.abs(x - f.x) <= f.w / 2 && Math.abs(y - f.y) <= f.h / 2;
  const dx = x - f.x, dy = y - f.y;
  return dx * dx + dy * dy <= f.r * f.r;
}

// --- shared furniture -------------------------------------------------------

function perimeter(out) {
  const e = 0.6, k = 14; // corner chamfer
  const ring = [
    [e + k, e, W - e - k, e], [W - e, e + k, W - e, H - e - k],
    [W - e - k, H - e, e + k, H - e], [e, H - e - k, e, e + k],
    [e + k, e, e, e + k], [W - e - k, e, W - e, e + k],
    [W - e, H - e - k, W - e - k, H - e], [e, H - e - k, e + k, H - e],
  ];
  for (const [ax, ay, bx, by] of ring) out.push(seg(ax, ay, bx, by, { rest: 0.9, tag: 'wall' }));
  return out;
}

// The goal a team attacks, plus the keeper that guards it.
//
// `forTeam` 0 attacks the top; the *other* marble is physically barred from that
// mouth by an `only`-filtered wall, so own goals cannot happen and the result is
// never ambiguous. The keeper is a visible bar sliding across the mouth: if you
// can see it is out of position, you can see why the goal went in.
function goalUnit(out, forTeam, opts) {
  const top = forTeam === 0;
  const y = top ? GOAL_LINE : H - GOAL_LINE;
  const halfW = opts.mouth;
  const kw = opts.keeper;
  const dir = top ? 1 : -1;

  // Posts
  out.push(seg(CX - halfW, y - 6 * dir, CX - halfW, y + 3 * dir, { rest: 0.95, tag: 'post' }));
  out.push(seg(CX + halfW, y - 6 * dir, CX + halfW, y + 3 * dir, { rest: 0.95, tag: 'post' }));
  // Back of the net pocket, so a scoring marble is caught and visibly "in".
  out.push(seg(CX - halfW, y - 10 * dir, CX + halfW, y - 10 * dir, { rest: 0.2, tag: 'net' }));
  out.push(seg(CX - halfW, y - 10 * dir, CX - halfW, y - 1 * dir, { rest: 0.2, tag: 'net' }));
  out.push(seg(CX + halfW, y - 10 * dir, CX + halfW, y - 1 * dir, { rest: 0.2, tag: 'net' }));
  // The defending marble simply cannot enter this mouth.
  out.push({ ...seg(CX - halfW, y, CX + halfW, y, { rest: 0.85, tag: 'goalline' }), only: 1 - forTeam });
  // Keeper: oscillates across the mouth. Both keepers share one period and
  // one amplitude; only the phase differs, and both phases are drawn i.i.d.
  const travel = halfW - kw / 2;
  out.push(seg(CX - kw / 2, y + 1.6 * dir, CX + kw / 2, y + 1.6 * dir, {
    rest: 1.0, tag: 'keeper', friction: 0.02,
    motion: osc(1, 0, travel, opts.period, opts.phase),
  }));

  // Approach funnels. Without them a marble almost never finds a 27-unit mouth
  // at the far end of a 170-unit pitch, and matches finish 0-0. With them the
  // attacking third reads like a real attacking third: get the marble up there
  // with pace and it gets channelled at goal, where the keeper decides it.
  const fl = opts.funnel;
  out.push(seg(CX - halfW, y, CX - halfW - fl.w, y + fl.h * dir, { rest: 0.94, tag: 'funnel' }));
  out.push(seg(CX + halfW, y, CX + halfW + fl.w, y + fl.h * dir, { rest: 0.94, tag: 'funnel' }));
  // Corner pockets behind the funnels get a live bumper so nothing settles there.
  out.push(bumper(9, y + 9 * dir, 3.0, { kick: 8, tag: 'corner' }));
  out.push(bumper(W - 9, y + 9 * dir, 3.0, { kick: 8, tag: 'corner' }));
  return out;
}

function goalSpec(forTeam, mouth) {
  const top = forTeam === 0;
  return { forTeam, y: top ? GOAL_LINE : H - GOAL_LINE, dir: top ? -1 : 1, cx: CX, halfW: mouth };
}

// Kickoff and restart placements are exact 180-degree images of each other.
const SPAWN = {
  kickoff: [{ x: CX - 8, y: CY + 10 }, { x: CX + 8, y: CY - 10 }],
  restart: [{ x: CX, y: CY + 45 }, { x: CX, y: CY - 45 }],
};

// ---------------------------------------------------------------------------
// Arena builders. Each returns a fully-specified, already-validated arena.
// `tension` is 0 (group stage) .. 1 (final) and only adds environmental drama.
// ---------------------------------------------------------------------------

function baseSpec(id, name, blurb, rng, tension, over = {}) {
  const mouth = over.mouth ?? 13.5;
  const keeper = over.keeper ?? (6.0 + 1.8 * tension);
  const period = over.period ?? (3.4 - 0.7 * tension);
  const funnel = over.funnel ?? { w: 26, h: 36 };
  const colliders = [];
  perimeter(colliders);
  goalUnit(colliders, 0, { mouth, keeper, period, funnel, phase: rng.range(0, 1) });
  goalUnit(colliders, 1, { mouth, keeper, period, funnel, phase: rng.range(0, 1) });
  return {
    id, name, blurb,
    width: W, height: H,
    gravity: { x: 0, y: 0 },
    drag: over.drag ?? 0.15,
    colliders,
    goals: [goalSpec(0, mouth), goalSpec(1, mouth)],
    drains: [],
    // Force fields: pulsing attractors and repulsors. Added in 180-degree pairs
    // exactly like colliders, so they cannot favour an end.
    fields: [],
    spawns: SPAWN,
    launch: { speed: over.launchSpeed ?? 30, spread: over.launchSpread ?? 0.55 },
    // Forward drive: how hard each marble pushes towards the end it is attacking.
    // Calibrated per arena in tuning.js; `over.drive` is only the fallback used
    // while a new arena is being written.
    drive: DRIVE[id] ?? over.drive ?? 16,
    decor: { theme: over.theme || 'grass', tension },
  };
}

// 1. SPIN GATE -- rotating arms sweep the pitch. Readable because you can watch
//    an arm about to strike and know the marble is about to be redirected.
function buildRotor(rng, tension) {
  const a = baseSpec('rotor', 'Spin Gate', 'Rotating arms sweep the pitch and fling marbles into new lanes.', rng, tension);
  const c = a.colliders;
  const omega = 1.5 + 0.55 * tension;

  // Two three-armed rotors, 180-degree twins of each other.
  const rx = 27 + rng.range(-3, 3), ry = 52 + rng.range(-5, 5);
  const arms = 3, L = 16;
  for (let i = 0; i < arms; i++) {
    const ang = (i / arms) * TAU + rng.range(0, 0.4);
    pair(c, seg(rx, ry, rx + L * dcos(ang), ry + L * dsin(ang), {
      rest: 1.02, tag: 'rotor', motion: rot(rx, ry, omega, ang * 0),
    }));
  }
  pair(c, bumper(rx, ry, 3.4, { rest: 1.0, kick: 3, tag: 'hub' }));

  // Centre rotor: two arms, so it is its own 180-degree twin.
  const cl = 19 + 3 * tension;
  for (const s of [1, -1]) {
    solo(c, seg(CX, CY, CX + s * cl, CY, { rest: 1.02, tag: 'rotor', motion: rot(CX, CY, -omega * 0.8, 0) }));
  }
  solo(c, bumper(CX, CY, 4.2, { rest: 1.0, kick: 4, tag: 'hub' }));

  // Static pegs that keep play from settling into a rut.
  pair(c, bumper(12 + rng.range(-2, 2), 88, 2.6, { kick: 6, tag: 'peg' }));
  pair(c, bumper(72, 34 + rng.range(-4, 4), 2.6, { kick: 6, tag: 'peg' }));
  a.decor.theme = 'grass';
  return a;
}

// 2. PINBALL STADIUM -- highest-energy arena. Bumpers inject speed so chances
//    come thick and fast; expect the loudest, highest-scoring matches.
function buildPinball(rng, tension) {
  const a = baseSpec('pinball', 'Pinball Stadium', 'Live bumpers and slingshots fire marbles back into the danger zone.', rng, tension, {
    drag: 0.20, mouth: 13.5, launchSpeed: 34, drive: 22, theme: 'neon',
  });
  const c = a.colliders;
  const kick = 15 + 5 * tension;

  pair(c, bumper(26 + rng.range(-3, 3), 46 + rng.range(-4, 4), 5.0, { kick, tag: 'bumper' }));
  pair(c, bumper(63 + rng.range(-3, 3), 62 + rng.range(-4, 4), 4.2, { kick, tag: 'bumper' }));
  pair(c, bumper(18, 118, 3.6, { kick: kick * 0.8, tag: 'bumper' }));
  solo(c, bumper(CX, CY, 6.0, { kick: kick * 1.25, tag: 'bumper' }));

  // Slingshot rails angled to return the marble up-pitch for whoever hits them.
  pair(c, seg(8, 66, 24, 78, { rest: 1.0, kick: 9, tag: 'sling' }));
  pair(c, seg(92, 66, 76, 78, { rest: 1.0, kick: 9, tag: 'sling' }));

  // Two sliding blockers in front of the danger areas.
  pair(c, seg(CX - 13, 34, CX + 13, 34, {
    rest: 0.95, tag: 'blocker', motion: osc(1, 0, 15, 2.8 - 0.5 * tension, rng.range(0, 1)),
  }));
  return a;
}

// 3. CRUMBLE PITCH -- the floor is the hazard. Tiles dissolve on a schedule and
//    a marble caught over one loses possession and restarts in its own half.
//    Nothing here can eliminate a nation; it only costs an attack.
function buildCrumble(rng, tension) {
  const a = baseSpec('crumble', 'Crumble Pitch', 'The surface gives way in patches. Lose the floor, lose the attack.', rng, tension, {
    drag: 0.13, mouth: 14.5, drive: 14, theme: 'frost',
  });
  const c = a.colliders;

  // Sparse obstacles: the drama is underfoot, not overhead.
  pair(c, bumper(24, 60, 3.2, { kick: 7, tag: 'peg' }));
  pair(c, seg(64, 40, 86, 52, { rest: 0.95, tag: 'rail' }));

  const cols = 4, rows = 5;
  const cycle = 7.5 - 1.8 * tension;
  const openFor = 2.6 + 0.9 * tension;
  for (let gx = 0; gx < cols; gx++) {
    for (let gy = 0; gy < rows; gy++) {
      const x = 18 + gx * 21.3, y = 34 + gy * 17;
      if (y > CY) continue;                       // build the top half, mirror it
      const phase = rng.range(0, cycle);
      const d = { x, y, r: 5.4, cycle, phase, openFor, tag: 'tile' };
      const m = rp(x, y);
      a.drains.push(d, { x: m.x, y: m.y, r: 5.4, cycle, phase, openFor, tag: 'tile' });
    }
  }
  return a;
}

// 4. CHANNEL RUN -- doors in three cross-pitch walls open and close, so routes
//    appear and vanish. Produces the closest finishes: a marble can be held up
//    on the edge of a closing door while the opponent breaks clear.
function buildChannels(rng, tension) {
  const a = baseSpec('channels', 'Channel Run', 'Doors open and close across the pitch. Read the gap or get shut out.', rng, tension, {
    drag: 0.12, launchSpeed: 36, drive: 17, theme: 'court',
  });
  const c = a.colliders;
  const period = 3.6 - 0.9 * tension;

  // Two cross-pitch door walls (plus their twins), each split into four panels.
  for (const wy of [46, 74]) {
    const phase0 = rng.range(0, 1);
    for (let i = 0; i < 4; i++) {
      const x0 = 1 + i * 24.5, x1 = x0 + 24.5;
      // Alternate panels share a gate, so exactly half the wall is open at once.
      const g = gate(period, (phase0 + (i % 2) * 0.5) % 1, 0.42);
      pair(c, seg(x0, wy, x1, wy, { rest: 0.92, tag: 'door', gate: g }));
    }
  }
  // Diagonal deflectors feeding the wings.
  pair(c, seg(2, 96, 22, 108, { rest: 0.98, kick: 4, tag: 'rail' }));
  pair(c, bumper(CX, 60, 4.0, { kick: 9, tag: 'peg' }));
  solo(c, bumper(CX, CY, 3.0, { kick: 5, tag: 'peg' }));
  return a;
}

// 5. KNOCKOUT BOWL -- both marbles are trapped in a rotating ring and can only
//    break out through a moving gap. Constant contact, sudden releases.
function buildBowl(rng, tension) {
  const a = baseSpec('bowl', 'Knockout Bowl', 'Trapped in a turning ring. Find the gap, then find the goal.', rng, tension, {
    drag: 0.12, mouth: 15.0, keeper: 6.4, launchSpeed: 30, drive: 11, theme: 'stone',
  });
  const c = a.colliders;
  const R = 31, N = 36;
  const omega = 0.85 + 0.35 * tension;
  const gapHalf = 5;                     // panels removed at each of two opposite gaps
  for (let i = 0; i < N; i++) {
    const i2 = i % (N / 2);
    if (i2 < gapHalf) continue;          // symmetric pair of gaps, 180 degrees apart
    const a0 = (i / N) * TAU, a1 = ((i + 1) / N) * TAU;
    c.push(seg(CX + R * dcos(a0), CY + R * dsin(a0), CX + R * dcos(a1), CY + R * dsin(a1), {
      rest: 0.99, tag: 'ring', motion: rot(CX, CY, omega, 0),
    }));
  }
  solo(c, bumper(CX, CY, 5.5, { kick: 11, tag: 'bumper' }));
  pair(c, bumper(CX, 34, 3.0, { kick: 7, tag: 'peg' }));
  pair(c, bumper(20, 58, 2.8, { kick: 7, tag: 'peg' }));
  a.spawns = { kickoff: [{ x: CX - 9, y: CY + 9 }, { x: CX + 9, y: CY - 9 }], restart: SPAWN.restart };
  return a;
}

// 6. GRAND ARENA -- finals only. Everything at once: a pulsing centre, rotors,
//    live bumpers and the tightest keepers in the game.
function buildGrand(rng, tension) {
  const a = baseSpec('grand', 'The Grand Arena', 'The final. Every mechanism in the game, turned up.', rng, 1, {
    drag: 0.16, mouth: 13.5, keeper: 7.4, period: 2.5, launchSpeed: 35, drive: 20, theme: 'gold',
  });
  const c = a.colliders;
  const omega = 2.0;
  for (const s of [1, -1]) {
    solo(c, seg(CX, CY, CX + s * 21, CY, { rest: 1.04, tag: 'rotor', motion: rot(CX, CY, omega, 0) }));
    solo(c, seg(CX, CY, CX, CY + s * 21, { rest: 1.04, tag: 'rotor', motion: rot(CX, CY, omega, 0) }));
  }
  solo(c, bumper(CX, CY, 5.0, { kick: 13, tag: 'hub' }));
  pair(c, bumper(22, 44, 4.4, { kick: 17, tag: 'bumper' }));
  pair(c, bumper(74, 66, 3.8, { kick: 15, tag: 'bumper' }));
  pair(c, seg(6, 74, 26, 86, { rest: 1.0, kick: 8, tag: 'sling' }));
  pair(c, seg(CX - 14, 30, CX + 14, 30, { rest: 0.95, tag: 'blocker', motion: osc(1, 0, 17, 2.2, rng.range(0, 1)) }));
  const m = rp(30, 56);
  a.drains.push({ x: 30, y: 56, r: 4.6, cycle: 6.0, phase: rng.range(0, 6), openFor: 2.2, tag: 'tile' });
  a.drains.push({ x: m.x, y: m.y, r: 4.6, cycle: 6.0, phase: rng.range(0, 6), openFor: 2.2, tag: 'tile' });
  return a;
}

// 7. MAGNET DRIFT -- pulsing fields bend the marbles' paths. Nothing touches
//    them and yet their routes curve: the most alien-looking arena, and the one
//    where a marble can be dragged off a certain goal at the last moment.
function buildMagnets(rng, tension) {
  const a = baseSpec('magnets', 'Magnet Drift', 'Invisible fields pulse on and off. Routes bend without anything touching the marble.', rng, tension, {
    drag: 0.22, mouth: 12.0, keeper: 8.4, launchSpeed: 30, drive: 4, theme: 'void',
  });
  const c = a.colliders;
  const cycle = 4.2 - 1.1 * tension;

  fieldPair(a.fields, { x: 30, y: 56, r: 30, strength: -62 - 20 * tension, cycle, phase: rng.range(0, cycle), onFor: cycle * 0.45, kind: 'push' });
  fieldPair(a.fields, { x: 74, y: 40, r: 26, strength: 54 + 18 * tension, cycle, phase: rng.range(0, cycle), onFor: cycle * 0.4, kind: 'pull' });
  a.fields.push({ x: CX, y: CY, r: 34, strength: -72, cycle: cycle * 1.6, phase: rng.range(0, cycle), onFor: cycle * 0.55, kind: 'push' });

  pair(c, bumper(30, 56, 2.4, { kick: 5, tag: 'node' }));
  pair(c, bumper(74, 40, 2.4, { kick: 5, tag: 'node' }));
  solo(c, bumper(CX, CY, 3.2, { kick: 7, tag: 'node' }));
  pair(c, seg(6, 100, 24, 112, { rest: 0.98, tag: 'rail' }));
  return a;
}

// 8. SPLIT DECISION -- a wall divides the pitch and the only way across is a
//    turning three-arm gate in the middle. Both marbles have to queue for it.
function buildSplit(rng, tension) {
  const a = baseSpec('split', 'Split Decision', 'One wall, one turning gate. Nobody attacks until they get through it.', rng, tension, {
    drag: 0.16, mouth: 12.5, keeper: 8.6, launchSpeed: 30, drive: 4, theme: 'clay',
  });
  const c = a.colliders;
  const hole = 15;
  const omega = 1.5 + 0.7 * tension;

  // Divider, with the gate hole in the middle.
  c.push(seg(0.6, CY, CX - hole, CY, { rest: 0.9, tag: 'divider' }));
  c.push(seg(CX + hole, CY, W - 0.6, CY, { rest: 0.9, tag: 'divider' }));
  // Guide rails on both sides, feeding play into the gate.
  pair(c, seg(14, CY - 26, CX - hole + 2, CY - 3, { rest: 0.95, tag: 'funnel' }));
  pair(c, seg(W - 14, CY - 26, CX + hole - 2, CY - 3, { rest: 0.95, tag: 'funnel' }));
  // The turnstile: FOUR arms, not three. An odd-armed rotor on the centre line
  // is not its own 180-degree twin, so it would quietly favour one end -- which
  // is exactly what the symmetry test in tools/validate.mjs caught.
  for (let i = 0; i < 4; i++) {
    const ang = (i / 4) * TAU;
    solo(c, seg(CX, CY, CX + (hole - 1.5) * dcos(ang), CY + (hole - 1.5) * dsin(ang), {
      rest: 0.9, tag: 'rotor', motion: rot(CX, CY, omega, ang),
    }));
  }
  solo(c, bumper(CX, CY, 2.6, { rest: 0.92, kick: 1.5, tag: 'hub' }));
  pair(c, bumper(20, 44, 3.0, { kick: 8, tag: 'peg' }));
  pair(c, bumper(78, 66 - 26, 2.8, { kick: 8, tag: 'peg' }));
  a.spawns = { kickoff: [{ x: CX - 10, y: CY + 22 }, { x: CX + 10, y: CY - 22 }], restart: SPAWN.restart };
  return a;
}

// 9. TIDE ARENA -- two heavy bars sweep the length of the pitch like pistons,
//    compressing play into a shrinking band and then releasing it.
function buildTide(rng, tension) {
  const a = baseSpec('tide', 'Tide Arena', 'Two heavy bars sweep the pitch. Get caught on the wrong side of one.', rng, tension, {
    drag: 0.14, mouth: 15.0, keeper: 5.4, launchSpeed: 31, drive: 36, theme: 'ice',
  });
  const c = a.colliders;
  const period = 5.2 - 1.4 * tension;
  const ph = rng.range(0, 1);

  pair(c, seg(4, 48, 48, 48, {
    rest: 0.98, tag: 'blocker', motion: osc(0, 1, 18 + 4 * tension, period, ph),
  }));
  pair(c, seg(74, 78, W - 4, 78, {
    rest: 0.98, tag: 'blocker', motion: osc(0, 1, 14 + 4 * tension, period * 0.8, (ph + 0.5) % 1),
  }));
  pair(c, bumper(66, 44, 3.4, { kick: 10, tag: 'bumper' }));
  solo(c, bumper(CX, CY, 4.4, { kick: 11, tag: 'bumper' }));
  return a;
}


// ---------------------------------------------------------------------------
// Arenas 10-24. Each one leads with a different mechanic rather than a
// different colour: what changes is what the marble has to solve.
// ---------------------------------------------------------------------------

// 10. CAROUSEL -- six bumpers ride a turntable around the centre circle, so the
//     whole middle of the pitch sweeps sideways and nothing holds a line.
function buildCarousel(rng, tension) {
  const a = baseSpec('carousel', 'Carousel', 'Six bumpers ride a turntable. The middle of the pitch is always moving sideways.', rng, tension, {
    drag: 0.16, mouth: 13.5, launchSpeed: 32, theme: 'candy',
  });
  const c = a.colliders;
  const omega = 1.0 + 0.5 * tension, R = 22 + rng.range(-2, 2);
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * TAU;
    solo(c, bumper(CX + R * dcos(ang), CY + R * dsin(ang), 4.0, {
      kick: 11 + 4 * tension, tag: 'bumper', motion: rot(CX, CY, omega, 0),
    }));
  }
  solo(c, bumper(CX, CY, 3.6, { kick: 6, tag: 'hub' }));
  pair(c, bumper(14, 52, 2.6, { kick: 7, tag: 'peg' }));
  return a;
}

// 11. HOURGLASS -- the pitch is pinched to a narrow neck at the halfway line.
//     Everything has to come through the middle, and the queue is the drama.
function buildHourglass(rng, tension) {
  const a = baseSpec('hourglass', 'Hourglass', 'The pitch narrows to a neck at halfway. Everything has to come through it.', rng, tension, {
    drag: 0.18, mouth: 13.0, keeper: 8.4, launchSpeed: 31, theme: 'sand',
  });
  const c = a.colliders;
  const neck = 15 - 3 * tension;
  pair(c, seg(1, 54, CX - neck, CY, { rest: 0.95, tag: 'wall' }));
  pair(c, seg(W - 1, 54, CX + neck, CY, { rest: 0.95, tag: 'wall' }));
  pair(c, bumper(CX - neck - 5, CY - 9, 2.6, { kick: 8, tag: 'peg' }));
  pair(c, bumper(24, 40, 3.0, { kick: 7, tag: 'peg' }));
  solo(c, bumper(CX, CY, 2.4, { kick: 9, tag: 'hub' }));
  // Break the straight run out of the neck, or the arena scores five a game.
  pair(c, bumper(CX - 9, 60, 3.4, { kick: 6, tag: 'peg' }));
  pair(c, seg(CX + 6, 52, CX + 22, 44, { rest: 0.95, tag: 'rail' }));
  return a;
}

// 12. SPIRAL VAULT -- two interleaved spiral walls wind out from the centre, so
//     a marble that enters the middle is carried round before it is spat out.
function buildSpiral(rng, tension) {
  const a = baseSpec('spiral', 'Spiral Vault', 'Two spiral walls wind out from the centre. Whatever goes in comes out somewhere else.', rng, tension, {
    drag: 0.13, mouth: 14.0, launchSpeed: 32, theme: 'deep',
  });
  const c = a.colliders;
  // 1.9 turns of solid wall sealed the middle of the pitch and the arena
  // finished 0-0 every time. Fewer turns, a shorter reach, and a gap punched
  // through every fifth panel so a marble can always cross radially.
  const turns = 1.15, steps = 20, r0 = 8, r1 = 31;
  for (const off of [0, PI]) {                    // two arms, 180 degrees apart
    for (let i = 0; i < steps; i++) {
      if (i % 5 === 3) continue;                  // radial gap
      const u0 = i / steps, u1 = (i + 1) / steps;
      const a0 = off + u0 * turns * TAU, a1 = off + u1 * turns * TAU;
      const R0 = r0 + (r1 - r0) * u0, R1 = r0 + (r1 - r0) * u1;
      c.push(seg(CX + R0 * dcos(a0), CY + R0 * dsin(a0), CX + R1 * dcos(a1), CY + R1 * dsin(a1),
        { rest: 0.96, tag: 'rail' }));
    }
  }
  solo(c, bumper(CX, CY, 3.2, { kick: 12, tag: 'hub' }));
  pair(c, bumper(16, 50, 2.8, { kick: 8, tag: 'peg' }));
  return a;
}

// 13. BOUNCE CHAMBER -- almost nothing on the pitch and walls that give back
//     more than they take. Long, fast, flat ricochets from end to end.
function buildBounce(rng, tension) {
  const a = baseSpec('bounce', 'Bounce Chamber', 'Live walls, almost no furniture. Long ricochets, end to end.', rng, tension, {
    drag: 0.11, mouth: 12.5, keeper: 8.0, launchSpeed: 38, theme: 'mono',
  });
  const c = a.colliders;
  for (const col of c) if (col.tag === 'wall') col.rest = 1.04;
  pair(c, bumper(20 + rng.range(-3, 3), 64, 3.0, { kick: 9, tag: 'peg' }));
  solo(c, bumper(CX, CY, 3.8, { kick: 10, tag: 'peg' }));
  return a;
}

// 14. CROSSFIRE -- four long diagonals cut the pitch into a saltire with a hole
//     at the middle. Every route is a diagonal and every deflection is sharp.
function buildCrossfire(rng, tension) {
  const a = baseSpec('crossfire', 'Crossfire', 'Four long diagonals and one hole in the middle. Every route is a deflection.', rng, tension, {
    drag: 0.12, mouth: 14.0, launchSpeed: 33, theme: 'ember',
  });
  const c = a.colliders;
  const gap = 11;
  pair(c, seg(4, 46, CX - gap, CY - gap, { rest: 1.0, kick: 3, tag: 'rail' }));
  pair(c, seg(W - 4, 46, CX + gap, CY - gap, { rest: 1.0, kick: 3, tag: 'rail' }));
  pair(c, bumper(CX, 44, 3.2, { kick: 9, tag: 'peg' }));
  solo(c, bumper(CX, CY, 4.6, { kick: 13, tag: 'bumper' }));
  return a;
}

// 15. PENDULUM ROW -- long arms swing from anchors on the side walls. Slow,
//     heavy, and they arrive exactly when you have stopped expecting them.
function buildPendulum(rng, tension) {
  const a = baseSpec('pendulum', 'Pendulum Row', 'Long arms swing in from the walls. Slow, heavy, and always late.', rng, tension, {
    drag: 0.17, mouth: 13.5, keeper: 8.2, launchSpeed: 31, theme: 'forest',
  });
  const c = a.colliders;
  const omega = 0.7 + 0.35 * tension;
  for (const [ax, ay, sign] of [[3, 56, 1], [W - 3, 76, -1], [3, 100, 1], [W - 3, 38, -1]]) {
    pair(c, seg(ax, ay, ax + sign * 34, ay, {
      rest: 1.0, tag: 'rotor', motion: rot(ax, ay, omega * sign, rng.range(0, 1)),
    }));
  }
  pair(c, bumper(30, 108, 3.0, { kick: 8, tag: 'peg' }));
  // A slow bar across the middle, so the pitch is not wide open between sweeps.
  for (const sgn of [1, -1]) {
    solo(c, seg(CX, CY, CX + sgn * 20, CY, { rest: 1.0, tag: 'rotor', motion: rot(CX, CY, -omega * 0.8, 0) }));
  }
  solo(c, bumper(CX, CY, 3.0, { kick: 5, tag: 'hub' }));
  return a;
}

// 16. IRIS GATE -- a ring around the centre circle that opens and shuts. Being
//     inside when it closes costs you the attack you were about to make.
function buildIris(rng, tension) {
  const a = baseSpec('iris', 'Iris Gate', 'A ring around the centre opens and shuts. Do not be inside when it does.', rng, tension, {
    drag: 0.13, mouth: 14.0, launchSpeed: 32, theme: 'plasma',
  });
  const c = a.colliders;
  const R = 21, N = 16;
  const g = gate(5.0 - 1.4 * tension, rng.range(0, 1), 0.5);
  for (let i = 0; i < N; i++) {
    const a0 = (i / N) * TAU, a1 = ((i + 0.78) / N) * TAU;
    c.push(seg(CX + R * dcos(a0), CY + R * dsin(a0), CX + R * dcos(a1), CY + R * dsin(a1),
      { rest: 0.98, tag: 'door', gate: g }));
  }
  solo(c, bumper(CX, CY, 5.0, { kick: 12, tag: 'bumper' }));
  pair(c, bumper(18, 46, 2.8, { kick: 8, tag: 'peg' }));
  return a;
}

// 17. CONVEYOR LANES -- belts run up one wing and down the other. Pick the right
//     lane and you are carried at goal; pick wrong and you are carried home.
function buildConveyor(rng, tension) {
  const a = baseSpec('conveyor', 'Conveyor Lanes', 'Belts run up one wing and down the other. The lane you take decides the attack.', rng, tension, {
    drag: 0.17, mouth: 14.0, launchSpeed: 30, theme: 'copper',
  });
  const c = a.colliders;
  const push = 40 + 14 * tension;
  fieldPair(a.fields, { x: 17, y: CY, w: 22, h: 78, r: 0, strength: push, dirX: 0, dirY: -1, kind: 'belt' });
  fieldPair(a.fields, { x: 50, y: 46, w: 40, h: 26, r: 0, strength: push * 0.7, dirX: 1, dirY: 0, kind: 'belt' });
  pair(c, seg(29, 46, 29, 124, { rest: 0.94, tag: 'rail' }));
  pair(c, bumper(CX + 8, 62, 3.2, { kick: 9, tag: 'peg' }));
  return a;
}

// 18. BUMPER FOREST -- a staggered thicket of small live pegs. No single big
//     obstacle, just a hundred small decisions.
function buildForest(rng, tension) {
  const a = baseSpec('forest', 'Bumper Forest', 'A thicket of small live pegs. No big obstacle, a hundred small ones.', rng, tension, {
    drag: 0.18, mouth: 14.5, launchSpeed: 32, theme: 'moss',
  });
  const c = a.colliders;
  const kick = 7 + 3 * tension;
  for (let row = 0; row < 4; row++) {
    const y = 48 + row * 12;
    for (let i = 0; i < 4; i++) {
      const x = 13 + i * 24 + (row % 2 ? 12 : 0) + rng.range(-1.5, 1.5);
      if (x > W - 8) continue;
      pair(c, bumper(x, y, 2.2, { kick, tag: 'peg' }));
    }
  }
  solo(c, bumper(CX, CY, 2.8, { kick: kick + 3, tag: 'peg' }));
  return a;
}

// 19. TWIN RINGS -- two counter-turning rings sit off each shoulder. Thread the
//     gap between them or go the long way round.
function buildTwinRings(rng, tension) {
  const a = baseSpec('twinrings', 'Twin Rings', 'Two counter-turning rings. Thread the gap between them, or go the long way.', rng, tension, {
    drag: 0.15, mouth: 13.5, keeper: 8.0, launchSpeed: 31, theme: 'cobalt',
  });
  const c = a.colliders;
  const R = 15, N = 18, omega = 1.2 + 0.5 * tension;
  const ring = (cx, cy, dir) => {
    for (let i = 0; i < N; i++) {
      if (i % 9 < 3) continue;
      const a0 = (i / N) * TAU, a1 = ((i + 1) / N) * TAU;
      pair(c, seg(cx + R * dcos(a0), cy + R * dsin(a0), cx + R * dcos(a1), cy + R * dsin(a1),
        { rest: 0.99, tag: 'ring', motion: rot(cx, cy, omega * dir, 0) }));
    }
    pair(c, bumper(cx, cy, 3.0, { kick: 8, tag: 'hub' }));
  };
  ring(27, 58, 1);
  return a;
}

// 20. GRAVITY WELLS -- four permanent attractors. Marbles are slung round them
//     like satellites and released on a completely new heading.
function buildWells(rng, tension) {
  const a = baseSpec('wells', 'Gravity Wells', 'Four permanent attractors. Marbles swing round them and leave on a new heading.', rng, tension, {
    drag: 0.16, mouth: 13.5, launchSpeed: 31, theme: 'nebula',
  });
  const strength = 70 + 25 * tension;
  fieldPair(a.fields, { x: 26, y: 54, r: 24, strength, kind: 'pull' });
  fieldPair(a.fields, { x: 72, y: 104 - 46, r: 20, strength: strength * 0.8, kind: 'pull' });
  pair(a.colliders, bumper(26, 54, 2.8, { kick: 6, tag: 'node' }));
  pair(a.colliders, bumper(72, 58, 2.4, { kick: 6, tag: 'node' }));
  solo(a.colliders, bumper(CX, CY, 3.4, { kick: 8, tag: 'node' }));
  return a;
}

// 21. SHUTTER GRID -- a chequerboard of panels that blink open and shut. The
//     pitch you can use is different every second and a half.
function buildShutters(rng, tension) {
  const a = baseSpec('shutters', 'Shutter Grid', 'A chequerboard of panels blinking open and shut. The usable pitch keeps changing.', rng, tension, {
    drag: 0.14, mouth: 14.0, launchSpeed: 32, theme: 'slate',
  });
  const c = a.colliders;
  const period = 3.0 - 0.8 * tension, ph = rng.range(0, 1);
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) {
      const x = 12 + col * 19, y = 50 + row * 12;
      const g = gate(period, (ph + ((row + col) % 2) * 0.5) % 1, 0.45);
      pair(c, seg(x, y, x + 15, y, { rest: 0.95, tag: 'door', gate: g }));
    }
  }
  return a;
}

// 22. SLALOM -- staggered posts force a weave. The cleanest-looking arena and
//     the one where a marble most obviously earns its run.
function buildSlalom(rng, tension) {
  const a = baseSpec('slalom', 'Slalom', 'Staggered posts force a weave. You can see the run being earned.', rng, tension, {
    drag: 0.16, mouth: 13.0, keeper: 8.4, launchSpeed: 33, theme: 'lime',
  });
  const c = a.colliders;
  for (let row = 0; row < 6; row++) {
    const y = 34 + row * 11;
    for (let i = 0; i < 3; i++) {
      const x = 18 + i * 32 + (row % 2 ? 16 : 0);
      if (x > W - 10) continue;
      pair(c, seg(x, y - 5, x, y + 5, { rest: 0.99, kick: 2, tag: 'post' }));
    }
  }
  solo(c, bumper(CX, CY, 3.0, { kick: 8, tag: 'peg' }));
  // Two posts guarding each goal. Without them the weave delivers the marble
  // straight at an open mouth and the arena scores three a game at any drive.
  pair(c, seg(CX - 6.5, 21, CX - 6.5, 29, { rest: 0.99, kick: 2, tag: 'post' }));
  pair(c, seg(CX + 6.5, 21, CX + 6.5, 29, { rest: 0.99, kick: 2, tag: 'post' }));
  return a;
}

// 23. DRUM -- a wide turning drum with paddles reaching inward. Slow, grinding,
//     low-scoring: the arena that makes a 1-0 feel earned.
function buildDrum(rng, tension) {
  const a = baseSpec('drum', 'The Drum', 'A wide turning drum with paddles. Slow, grinding, and a 1-0 feels earned.', rng, tension, {
    drag: 0.12, mouth: 15.0, keeper: 6.6, launchSpeed: 30, theme: 'rust',
  });
  const c = a.colliders;
  const R = 40, N = 32, omega = 0.5 + 0.25 * tension;
  for (let i = 0; i < N; i++) {
    if (i % 16 < 4) continue;
    const a0 = (i / N) * TAU, a1 = ((i + 1) / N) * TAU;
    c.push(seg(CX + R * dcos(a0), CY + R * dsin(a0), CX + R * dcos(a1), CY + R * dsin(a1),
      { rest: 0.97, tag: 'ring', motion: rot(CX, CY, omega, 0) }));
  }
  for (let i = 0; i < 4; i++) {                 // four paddles: own 180-degree twin
    const ang = (i / 4) * TAU;
    solo(c, seg(CX + R * dcos(ang), CY + R * dsin(ang), CX + (R - 12) * dcos(ang), CY + (R - 12) * dsin(ang),
      { rest: 1.0, tag: 'rotor', motion: rot(CX, CY, omega, 0) }));
  }
  solo(c, bumper(CX, CY, 4.2, { kick: 10, tag: 'hub' }));
  return a;
}

// 24. MINEFIELD -- a scatter of fast-blinking hazards. Losing the floor costs
//     the attack, never the tie, so this is tense rather than cruel.
function buildMinefield(rng, tension) {
  const a = baseSpec('minefield', 'Minefield', 'Hazards blink on and off across the pitch. Lose the floor, lose the attack.', rng, tension, {
    drag: 0.12, mouth: 15.0, launchSpeed: 33, theme: 'hazard',
  });
  const cycle = 3.4 - 0.9 * tension;
  const spots = [[20, 52], [44, 62], [70, 48], [30, 74], [62, 78], [84, 66]];
  for (const [x, y] of spots) {
    const f = { x, y, r: 4.6, cycle, phase: rng.range(0, cycle), openFor: cycle * 0.38, tag: 'tile' };
    const m = rp(x, y);
    a.drains.push(f, { ...f, x: m.x, y: m.y });
  }
  pair(a.colliders, bumper(12, 66, 2.6, { kick: 8, tag: 'peg' }));
  solo(a.colliders, bumper(CX, CY, 3.4, { kick: 9, tag: 'peg' }));
  return a;
}

// 25. CATAPULT ALLEY -- every rail is a launcher pointed up-pitch. Hit one and
//     you are fired at goal; the question is which one you hit.
function buildCatapult(rng, tension) {
  const a = baseSpec('catapult', 'Catapult Alley', 'Every rail is a launcher. Hit one and you are fired at goal.', rng, tension, {
    drag: 0.2, mouth: 13.0, keeper: 7.8, launchSpeed: 32, theme: 'sky',
  });
  const c = a.colliders;
  const kick = 20 + 7 * tension;
  pair(c, seg(6, 74, 30, 60, { rest: 1.0, kick, tag: 'sling' }));
  pair(c, seg(W - 6, 74, W - 30, 60, { rest: 1.0, kick, tag: 'sling' }));
  pair(c, seg(34, 96, 58, 84, { rest: 1.0, kick: kick * 0.75, tag: 'sling' }));
  pair(c, bumper(CX + 14, 52, 3.0, { kick: 9, tag: 'peg' }));
  solo(c, bumper(CX, CY, 3.6, { kick: 8, tag: 'peg' }));
  return a;
}

export const ARENAS = {
  rotor: buildRotor,
  pinball: buildPinball,
  crumble: buildCrumble,
  channels: buildChannels,
  bowl: buildBowl,
  magnets: buildMagnets,
  split: buildSplit,
  tide: buildTide,
  carousel: buildCarousel,
  hourglass: buildHourglass,
  spiral: buildSpiral,
  bounce: buildBounce,
  crossfire: buildCrossfire,
  pendulum: buildPendulum,
  iris: buildIris,
  conveyor: buildConveyor,
  forest: buildForest,
  twinrings: buildTwinRings,
  wells: buildWells,
  shutters: buildShutters,
  slalom: buildSlalom,
  drum: buildDrum,
  minefield: buildMinefield,
  catapult: buildCatapult,
  grand: buildGrand,
};

export const ARENA_META = {
  // Tier 1 -- learn the rules here. One mechanic each, all of it visible.
  rotor:     { name: 'Spin Gate',       tier: 1, rule: 'Rotating arms sweep the pitch and fling marbles into new lanes.' },
  pinball:   { name: 'Pinball Stadium', tier: 1, rule: 'Live bumpers and slingshots fire marbles back into the danger zone.' },
  channels:  { name: 'Channel Run',     tier: 1, rule: 'Doors open and close across the pitch. Read the gap or get shut out.' },
  slalom:    { name: 'Slalom',          tier: 1, rule: 'Staggered posts force a weave. You can see the run being earned.' },
  forest:    { name: 'Bumper Forest',   tier: 1, rule: 'A thicket of small live pegs. No big obstacle, a hundred small ones.' },
  bounce:    { name: 'Bounce Chamber',  tier: 1, rule: 'Live walls, almost no furniture. Long ricochets, end to end.' },
  carousel:  { name: 'Carousel',        tier: 1, rule: 'Six bumpers ride a turntable. The middle of the pitch is always moving.' },
  // Tier 2 -- the pitch starts moving with you.
  tide:      { name: 'Tide Arena',      tier: 2, rule: 'Two heavy bars sweep the pitch. Do not get caught on the wrong side.' },
  crumble:   { name: 'Crumble Pitch',   tier: 2, rule: 'The surface gives way in patches. Lose the floor, lose the attack.' },
  crossfire: { name: 'Crossfire',       tier: 2, rule: 'Four long diagonals and one hole in the middle. Every route is a deflection.' },
  hourglass: { name: 'Hourglass',       tier: 2, rule: 'The pitch narrows to a neck at halfway. Everything has to come through it.' },
  shutters:  { name: 'Shutter Grid',    tier: 2, rule: 'A chequerboard of panels blinking open and shut.' },
  conveyor:  { name: 'Conveyor Lanes',  tier: 2, rule: 'Belts run up one wing and down the other. The lane decides the attack.' },
  catapult:  { name: 'Catapult Alley',  tier: 2, rule: 'Every rail is a launcher. Hit one and you are fired at goal.' },
  // Tier 3 -- the pitch starts making decisions for you.
  split:     { name: 'Split Decision',  tier: 3, rule: 'One wall, one turning gate. Nobody attacks until they get through it.' },
  spiral:    { name: 'Spiral Vault',    tier: 3, rule: 'Two spiral walls wind out from the centre. What goes in comes out elsewhere.' },
  iris:      { name: 'Iris Gate',       tier: 3, rule: 'A ring around the centre opens and shuts. Do not be inside when it does.' },
  twinrings: { name: 'Twin Rings',      tier: 3, rule: 'Two counter-turning rings. Thread the gap, or go the long way.' },
  pendulum:  { name: 'Pendulum Row',    tier: 3, rule: 'Long arms swing in from the walls. Slow, heavy, and always late.' },
  minefield: { name: 'Minefield',       tier: 3, rule: 'Hazards blink on and off across the pitch. Lose the floor, lose the attack.' },
  wells:     { name: 'Gravity Wells',   tier: 3, rule: 'Four attractors. Marbles swing round them and leave on a new heading.' },
  drum:      { name: 'The Drum',        tier: 3, rule: 'A wide turning drum with paddles. Slow, grinding, and a 1-0 feels earned.' },
  // Tier 4 -- the last rounds.
  magnets:   { name: 'Magnet Drift',    tier: 4, rule: 'Fields pulse on and off. Routes bend with nothing touching the marble.' },
  bowl:      { name: 'Knockout Bowl',   tier: 4, rule: 'Trapped in a turning ring. Find the gap, then find the goal.' },
  grand:     { name: 'The Grand Arena', tier: 5, rule: 'The final. Every mechanism in the game, turned up.' },
};

export const ARENA_IDS = Object.keys(ARENA_META);
const TIER = (n) => ARENA_IDS.filter(id => ARENA_META[id].tier === n);

export function buildArena(id, rng, tension) {
  const fn = ARENAS[id] || ARENAS.rotor;
  return fn(rng, tension);
}

// Which arenas are allowed at which point in a tournament. Early rounds stay on
// tier 1 so the rules are learned before the pitch starts misbehaving.
// Which arenas can turn up when. Early rounds stay on tier 1 so the rules are
// learned before the pitch starts misbehaving; the final is always the same one.
export function arenaPoolForStage(stageKind, roundIndex, totalRounds) {
  if (stageKind === 'group') return TIER(1);
  const late = totalRounds > 0 ? roundIndex / totalRounds : 0;
  if (late >= 0.99) return TIER(5);
  if (late >= 0.66) return TIER(4).concat(TIER(3));
  if (late >= 0.33) return TIER(3).concat(TIER(2));
  return TIER(2).concat(TIER(1));
}

export function tensionForStage(stageKind, roundIndex, totalRounds) {
  if (stageKind === 'group') return 0.15;
  return totalRounds > 0 ? 0.35 + 0.65 * (roundIndex / totalRounds) : 0.5;
}

// The tension an arena is designed around, used by the test harness so each
// arena is measured in the conditions it will actually be played in.
export function designTension(id) {
  const t = (ARENA_META[id] || {}).tier || 1;
  return [0, 0.2, 0.45, 0.75, 0.9, 1][t];
}

export function drainActive(d, t) {
  if (d.cycle == null) return true;
  let u = (t - d.phase) % d.cycle;
  if (u < 0) u += d.cycle;
  return u < d.openFor;
}

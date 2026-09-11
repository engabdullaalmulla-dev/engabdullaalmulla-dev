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
import { dsin, dcos, TAU } from '../core/dmath.js';

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
    spawns: SPAWN,
    launch: { speed: over.launchSpeed ?? 30, spread: over.launchSpread ?? 0.55 },
    // Forward drive: how hard each marble pushes towards the end it is attacking.
    drive: over.drive ?? 6.2,
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
    drag: 0.20, mouth: 13.5, launchSpeed: 34, drive: 7.2, theme: 'neon',
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
    drag: 0.13, mouth: 14.5, drive: 5.6, theme: 'ice',
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
    drag: 0.12, launchSpeed: 36, drive: 5.0, theme: 'court',
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
    drag: 0.12, mouth: 15.0, keeper: 6.4, launchSpeed: 30, drive: 3.2, theme: 'stone',
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
    drag: 0.16, mouth: 13.5, keeper: 7.4, period: 2.5, launchSpeed: 35, drive: 7.0, theme: 'gold',
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

export const ARENAS = {
  rotor: buildRotor,
  pinball: buildPinball,
  crumble: buildCrumble,
  channels: buildChannels,
  bowl: buildBowl,
  grand: buildGrand,
};

export const ARENA_META = {
  rotor: { name: 'Spin Gate', tier: 1 },
  pinball: { name: 'Pinball Stadium', tier: 1 },
  channels: { name: 'Channel Run', tier: 1 },
  crumble: { name: 'Crumble Pitch', tier: 2 },
  bowl: { name: 'Knockout Bowl', tier: 2 },
  grand: { name: 'The Grand Arena', tier: 3 },
};

export function buildArena(id, rng, tension) {
  const fn = ARENAS[id] || ARENAS.rotor;
  return fn(rng, tension);
}

// Which arenas are allowed at which point in a tournament. Early rounds stay on
// tier 1 so the rules are learned before the pitch starts misbehaving.
export function arenaPoolForStage(stageKind, roundIndex, totalRounds) {
  if (stageKind === 'group') return ['rotor', 'pinball', 'channels'];
  const late = totalRounds > 0 ? roundIndex / totalRounds : 0;
  if (late >= 0.99) return ['grand'];
  if (late >= 0.5) return ['bowl', 'crumble', 'pinball'];
  return ['rotor', 'channels', 'crumble', 'pinball'];
}

export function tensionForStage(stageKind, roundIndex, totalRounds) {
  if (stageKind === 'group') return 0.15;
  return totalRounds > 0 ? 0.35 + 0.65 * (roundIndex / totalRounds) : 0.5;
}

export function drainActive(d, t) {
  if (d.cycle == null) return true;
  let u = (t - d.phase) % d.cycle;
  if (u < 0) u += d.cycle;
  return u < d.openFor;
}

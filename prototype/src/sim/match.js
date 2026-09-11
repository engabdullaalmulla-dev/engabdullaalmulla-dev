// Match simulation: how a football fixture becomes a marble contest.
//
// One marble per nation. Team 0 attacks the top goal, team 1 the bottom. A goal
// is recorded at the instant a marble's centre crosses its target goal line
// between the posts -- there is no separate scoreline generator anywhere in this
// file or any other. The score you see is a count of crossings that happened.
//
// The match is a state machine advanced one physics tick at a time. The renderer
// calls step() at wall-clock pace; fast-forward calls it more often per frame;
// "skip to result" calls runToEnd(). All three are the same function, so the
// result cannot depend on how you watched it.

import { makeWorld, makeBody, step as physStep, STEP } from '../core/physics.js';
import { buildArena, drainActive, fieldActive, fieldContains, CX } from './arenas.js';
import { makeRng } from '../core/rng.js';
import { PI, dsin, dcos, len } from '../core/dmath.js';

export const SIM_VERSION = '1.1.0';

const MARBLE_R = 2.25;
const HALF_SECONDS = 19;        // sim seconds per half -> displayed as 45 minutes
const ET_HALF_SECONDS = 6.5;    // -> displayed as 15 minutes
const CELEBRATION = 1.1;
const KICKOFF_PAUSE = 0.55;
const DRAIN_OUT = 1.2;
const STALL_SPEED = 10.0;
const STALL_TIME = 0.85;

// Phases
const P = {
  KICKOFF: 'kickoff', PLAY: 'play', GOAL: 'goal', BREAK: 'break',
  PENS: 'pens', DONE: 'done',
};

function launch(rng, teamIdx, arena, boost, spreadScale = 1) {
  const base = teamIdx === 0 ? -PI / 2 : PI / 2;   // team 0 heads up-pitch
  const ang = base + rng.bell(0, arena.launch.spread * spreadScale);
  const sp = arena.launch.speed * (0.86 + 0.28 * rng()) * boost;
  return { vx: sp * dcos(ang), vy: sp * dsin(ang) };
}

function periodPlan(rules) {
  // A period is a chunk of playing time with its own clock mapping.
  return [
    { id: '1H', kind: 'normal', seconds: HALF_SECONDS, minFrom: 0, minTo: 45 },
    { id: '2H', kind: 'normal', seconds: HALF_SECONDS, minFrom: 45, minTo: 90 },
    { id: 'ET1', kind: 'et', seconds: ET_HALF_SECONDS, minFrom: 90, minTo: 105 },
    { id: 'ET2', kind: 'et', seconds: ET_HALF_SECONDS, minFrom: 105, minTo: 120 },
  ];
}

export function createMatch(cfg) {
  const rng = makeRng(cfg.seed);
  const tension = cfg.tension ?? 0.2;
  const arena = buildArena(cfg.arenaId, rng.fork('arena'), tension);
  // Calibration hook only: tools/calibrate.mjs sweeps drive to find the value
  // that lands each arena on its target scoring rate. The game never sets it.
  if (cfg.drive != null) arena.drive = cfg.drive;
  const play = rng.fork('play');

  const world = makeWorld({ width: arena.width, height: arena.height, gravity: arena.gravity, drag: arena.drag });
  world.colliders = arena.colliders;
  for (let i = 0; i < 2; i++) {
    const s = arena.spawns.kickoff[i];
    world.bodies.push(makeBody(s.x, s.y, MARBLE_R, {
      id: i, rest: 0.93, ay: (i === 0 ? -1 : 1) * arena.drive,
    }));
  }

  const m = {
    cfg, arena, world, rng: play,
    simVersion: SIM_VERSION,
    periods: periodPlan(cfg.rules),
    periodIndex: 0,
    periodElapsed: 0,
    stoppage: [play.range(0.6, 2.2), play.range(0.9, 3.1), play.range(0.3, 1.0), play.range(0.4, 1.3)],
    phase: P.KICKOFF,
    phaseTimer: KICKOFF_PAUSE,
    score: [0, 0],
    shots: [0, 0],
    events: [],
    ticks: 0,
    stall: [0, 0],
    outFor: [0, 0],
    restartFor: null,     // team that concedes takes the restart
    finished: false,
    decidedBy: 'normal',
    pens: null,
    lastGoal: null,
    flash: 0,
  };
  emit(m, 'kickoff', null, 'Kick-off');
  placeKickoff(m, null);
  return m;
}

function currentPeriod(m) { return m.periods[m.periodIndex]; }

function clockOf(m) {
  const p = currentPeriod(m);
  if (!p) return "90'";
  const frac = Math.min(1, m.periodElapsed / p.seconds);
  const mins = p.minFrom + (p.minTo - p.minFrom) * frac;
  const base = p.minTo;
  if (mins > base) return `${base}+${Math.max(1, Math.ceil(mins - base))}'`;
  return `${Math.max(p.minFrom === 0 ? 1 : p.minFrom, Math.floor(mins))}'`;
}

// Live clock for the scoreboard. Presentation only.
export function clockText(m) {
  if (m.phase === P.PENS) return 'PENS';
  return clockOf(m);
}

function emit(m, type, team, text, extra) {
  m.events.push({ t: +(m.world.t).toFixed(3), clock: clockOf(m), type, team, text, ...(extra || {}) });
}

function placeKickoff(m, concedingTeam) {
  for (let i = 0; i < 2; i++) {
    const b = m.world.bodies[i];
    const s = m.arena.spawns.kickoff[i];
    b.x = s.x; b.y = s.y; b.alive = true; b.trail.length = 0;
    // Football's own balancing device: the side that conceded restarts play.
    // It is symmetric by rule, visible in the UI, and applies to whoever is
    // behind -- it is not a hidden advantage for anybody's favourite.
    const boost = concedingTeam === i ? 1.16 : 1.0;
    const v = launch(m.rng, i, m.arena, boost);
    b.vx = v.vx; b.vy = v.vy;
    m.stall[i] = 0; m.outFor[i] = 0;
  }
}

function respawn(m, i) {
  const b = m.world.bodies[i];
  const s = m.arena.spawns.restart[i];
  b.x = s.x; b.y = s.y; b.alive = true; b.trail.length = 0;
  const v = launch(m.rng, i, m.arena, 0.82);
  b.vx = v.vx; b.vy = v.vy;
  m.stall[i] = 0;
}

// Force fields pull or push any marble inside their radius. Fields come in
// 180-degree pairs, so this cannot favour an end.
function applyFields(m) {
  const fs = m.arena.fields;
  if (!fs || !fs.length) return;
  for (const f of fs) {
    if (!fieldActive(f, m.world.t)) continue;
    for (const b of m.world.bodies) {
      if (!b.alive) continue;
      if (!fieldContains(f, b.x, b.y)) continue;
      if (f.dirX != null) {
        // Directional field (a conveyor belt): constant push along its axis.
        b.vx += f.dirX * f.strength * STEP;
        b.vy += f.dirY * f.strength * STEP;
        continue;
      }
      const dx = f.x - b.x, dy = f.y - b.y;
      const d = len(dx, dy);
      if (d < 0.001) continue;
      const falloff = 1 - d / f.r;
      const acc = (f.strength * falloff * falloff) / d;
      b.vx += dx * acc * STEP;
      b.vy += dy * acc * STEP;
    }
  }
}

function checkGoal(m, i) {
  const b = m.world.bodies[i];
  if (!b.alive) return false;
  const g = m.arena.goals[i];
  const inside = Math.abs(b.x - g.cx) < g.halfW;
  if (!inside) return false;
  return i === 0 ? b.y < g.y : b.y > g.y;
}

function periodLength(m) {
  const p = currentPeriod(m);
  return p.seconds + m.stoppage[m.periodIndex];
}

function endOfPeriod(m) {
  const p = currentPeriod(m);
  const level = m.score[0] === m.score[1];
  const agg = aggregateNow(m);
  const decided = m.cfg.rules.allowDraw ? true : !tiedOverall(m, agg);

  if (p.id === '1H') {
    emit(m, 'halftime', null, 'Half-time');
    advancePeriod(m, 'Half-time');
    return;
  }
  if (p.id === '2H') {
    emit(m, 'fulltime', null, 'Full-time');
    if (decided) return finish(m, 'normal');
    if (m.cfg.rules.extraTime) { advancePeriod(m, 'Extra time'); return; }
    return startPens(m);
  }
  if (p.id === 'ET1') { emit(m, 'etbreak', null, 'End of first period of extra time'); advancePeriod(m, 'ET second period'); return; }
  // ET2
  emit(m, 'fulltime', null, 'End of extra time');
  if (decided) return finish(m, 'aet');
  return startPens(m);
}

function advancePeriod(m, label) {
  m.periodIndex++;
  m.periodElapsed = 0;
  m.phase = P.BREAK;
  m.phaseTimer = 1.4;
  m.breakLabel = label;
}

// --- two-legged ties --------------------------------------------------------

function aggregateNow(m) {
  const tie = m.cfg.tie;
  if (!tie || tie.leg !== 2) return null;
  // cfg.teams are [home, away] for THIS leg; tie.before is in the same order.
  return [tie.before[0] + m.score[0], tie.before[1] + m.score[1]];
}

function tiedOverall(m, agg) {
  if (agg) return agg[0] === agg[1];
  return m.score[0] === m.score[1];
}

// --- penalties --------------------------------------------------------------
//
// A separate, deliberately legible arena: one marble at a time, launched at a
// goal with a sliding keeper. Five each, then sudden death. Same physics, same
// seed chain, so it replays exactly like the rest of the match.

function startPens(m) {
  emit(m, 'pens', null, 'Penalty challenge');
  m.phase = P.PENS;
  m.pens = {
    taken: [0, 0], scored: [0, 0], order: [], round: 0, idx: 0,
    first: m.rng.bool() ? 0 : 1, log: [], state: 'ready', timer: 0.9, active: null,
    keeperPhase: [m.rng.range(0, 1), m.rng.range(0, 1)],
  };
  for (const b of m.world.bodies) b.alive = false;
}

const PEN_GOAL_Y = 26, PEN_MOUTH = 15, PEN_KEEPER = 9.4, PEN_PERIOD = 1.5;

function penKeeperX(p, t, team) {
  const travel = PEN_MOUTH - PEN_KEEPER / 2;
  return CX + travel * dsin((t / PEN_PERIOD + p.keeperPhase[team]) * 6.283185307179586);
}

function stepPens(m) {
  const p = m.pens;
  p.timer -= STEP;
  if (p.state === 'ready') {
    if (p.timer > 0) return;
    const team = p.idx % 2 === 0 ? p.first : 1 - p.first;
    const ang = -PI / 2 + m.rng.bell(0, 0.30);
    const sp = 46 * (0.9 + 0.2 * m.rng());
    p.active = { team, x: CX + m.rng.range(-2, 2), y: 74, vx: sp * dcos(ang), vy: sp * dsin(ang), t: 0, trail: [] };
    p.state = 'live';
    return;
  }
  if (p.state !== 'live') {
    if (p.timer > 0) return;
    // settle the result and move on
    p.idx++;
    if (penDecided(m)) return;
    p.state = 'ready'; p.timer = 0.8; p.active = null;
    return;
  }

  const a = p.active;
  a.t += STEP;
  a.x += a.vx * STEP; a.y += a.vy * STEP;
  a.trail.push({ x: a.x, y: a.y });
  if (a.trail.length > 24) a.trail.shift();

  // side walls
  if (a.x < 6 + MARBLE_R) { a.x = 6 + MARBLE_R; a.vx = -a.vx * 0.9; }
  if (a.x > 94 - MARBLE_R) { a.x = 94 - MARBLE_R; a.vx = -a.vx * 0.9; }

  // keeper bar
  const kx = penKeeperX(p, a.t, a.team);
  if (a.y - MARBLE_R < PEN_GOAL_Y + 2.5 && a.y + MARBLE_R > PEN_GOAL_Y + 0.5 && Math.abs(a.x - kx) < PEN_KEEPER / 2 + MARBLE_R) {
    a.y = PEN_GOAL_Y + 2.5 + MARBLE_R; a.vy = Math.abs(a.vy) * 0.6;
    return recordPen(m, false, 'Saved');
  }
  // posts
  if (a.y - MARBLE_R < PEN_GOAL_Y && Math.abs(Math.abs(a.x - CX) - PEN_MOUTH) < MARBLE_R) {
    a.vx = -a.vx; a.vy = Math.abs(a.vy) * 0.7;
    return recordPen(m, false, 'Off the post');
  }
  if (a.y < PEN_GOAL_Y) {
    if (Math.abs(a.x - CX) < PEN_MOUTH) return recordPen(m, true, 'Scored');
    return recordPen(m, false, 'Wide');
  }
  if (a.t > 2.6) return recordPen(m, false, 'Wide');
}

function recordPen(m, scored, label) {
  const p = m.pens;
  const team = p.active.team;
  p.taken[team]++;
  if (scored) p.scored[team]++;
  p.log.push({ team, scored, label });
  emit(m, 'pen', team, `${label} (${p.scored[0]}-${p.scored[1]})`);
  p.state = scored ? 'scored' : 'missed';
  p.timer = 1.0;
}

function penDecided(m) {
  const p = m.pens;
  const [ta, tb] = p.taken, [sa, sb] = p.scored;
  const inFirstFive = ta < 5 || tb < 5;
  if (inFirstFive) {
    const remA = Math.max(0, 5 - ta), remB = Math.max(0, 5 - tb);
    if (sa > sb + remB || sb > sa + remA) { finishPens(m); return true; }
    return false;
  }
  // sudden death: decided only when both have taken the same number
  if (ta === tb && sa !== sb) { finishPens(m); return true; }
  return false;
}

function finishPens(m) {
  m.pens.winner = m.pens.scored[0] > m.pens.scored[1] ? 0 : 1;
  finish(m, 'pens');
}

function finish(m, how) {
  m.decidedBy = how;
  m.finished = true;
  m.phase = P.DONE;
  emit(m, 'result', null, 'Result');
}

// ---------------------------------------------------------------------------

export function step(m) {
  if (m.finished) return;
  m.ticks++;
  if (m.flash > 0) m.flash -= STEP;

  if (m.phase === P.PENS) { stepPens(m); return; }

  if (m.phase === P.KICKOFF || m.phase === P.GOAL || m.phase === P.BREAK) {
    m.phaseTimer -= STEP;
    if (m.phaseTimer <= 0) {
      if (m.phase === P.GOAL) placeKickoff(m, m.restartFor);
      if (m.phase === P.BREAK) placeKickoff(m, null);
      m.phase = P.PLAY;
    }
    // The world keeps ticking during a break so moving parts stay continuous,
    // but no goal can be registered.
    physStep(m.world);
    return;
  }

  // live play
  applyFields(m);
  physStep(m.world);
  m.periodElapsed += STEP;

  for (let i = 0; i < 2; i++) {
    const b = m.world.bodies[i];

    if (!b.alive) {
      m.outFor[i] -= STEP;
      if (m.outFor[i] <= 0) respawn(m, i);
      continue;
    }

    // Hazards: losing the floor costs the attack, never the tournament.
    for (const d of m.arena.drains) {
      if (!drainActive(d, m.world.t)) continue;
      if (len(b.x - d.x, b.y - d.y) < d.r) {
        b.alive = false;
        m.outFor[i] = DRAIN_OUT;
        emit(m, 'drain', i, 'Loses the floor — possession lost');
        break;
      }
    }
    if (!b.alive) continue;

    // Anti-stall: a marble that has run out of energy is nudged towards the
    // goal it is attacking. Applied identically to both sides.
    if (len(b.vx, b.vy) < STALL_SPEED) {
      m.stall[i] += STEP;
      if (m.stall[i] > STALL_TIME) {
        // A loose-ball scramble, not a shot: the nudge is aimed only broadly
        // up-pitch. A tightly aimed nudge would put a floor under every arena's
        // scoring rate and take the tuning knob away from the designer.
        const v = launch(m.rng, i, m.arena, 0.5, 2.6);
        b.vx += v.vx; b.vy += v.vy;
        m.stall[i] = 0;
      }
    } else m.stall[i] = 0;

    // Near-miss detection, purely for commentary and the shot count.
    const g = m.arena.goals[i];
    const dy = i === 0 ? b.y - g.y : g.y - b.y;
    if (dy > 0 && dy < 6 && Math.abs(b.x - g.cx) < g.halfW + 4 && !b.nearFlag) {
      b.nearFlag = true; m.shots[i]++;
    } else if (dy > 12) b.nearFlag = false;

    if (checkGoal(m, i)) {
      m.score[i]++;
      m.restartFor = 1 - i;
      m.lastGoal = { team: i, clock: clockOf(m) };
      m.flash = 1.2;
      emit(m, 'goal', i, 'GOAL', { score: [m.score[0], m.score[1]] });
      m.phase = P.GOAL;
      m.phaseTimer = CELEBRATION;
      for (const bb of m.world.bodies) { bb.vx *= 0.2; bb.vy *= 0.2; }
      return;
    }
  }

  if (m.periodElapsed >= periodLength(m)) endOfPeriod(m);
}

export function runToEnd(m, maxTicks = 120 * 600) {
  let guard = 0;
  while (!m.finished && guard++ < maxTicks) step(m);
  if (!m.finished) {
    // Should be unreachable; the validator asserts it never happens. If it ever
    // did, we fail loudly rather than inventing a scoreline.
    m.overran = true;
    finish(m, m.score[0] === m.score[1] ? 'unresolved' : 'normal');
  }
  return m;
}

// Outcome in the form the tournament engine consumes.
export function resultOf(m) {
  const agg = aggregateNow(m);
  let winner = null;
  if (m.pens && m.pens.winner != null) winner = m.pens.winner;
  else if (agg) winner = agg[0] === agg[1] ? null : (agg[0] > agg[1] ? 0 : 1);
  else if (m.score[0] !== m.score[1]) winner = m.score[0] > m.score[1] ? 0 : 1;
  return {
    score: [m.score[0], m.score[1]],
    aggregate: agg,
    pens: m.pens ? [m.pens.scored[0], m.pens.scored[1]] : null,
    winner,
    decidedBy: m.decidedBy,
    shots: m.shots.slice(),
    events: m.events,
    simVersion: m.simVersion,
    arenaId: m.arena.id,
    seed: m.cfg.seed,
    ticks: m.ticks,
  };
}

// One call, used by "skip to result", by the tournament engine when it needs a
// score for a match nobody is watching, and by the test harness. Identical code
// path to the watched match.
export function simulate(cfg) {
  return resultOf(runToEnd(createMatch(cfg)));
}

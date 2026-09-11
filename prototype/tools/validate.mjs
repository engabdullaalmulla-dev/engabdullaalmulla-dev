// Simulation test harness.
//
// Run: node tools/validate.mjs [samplesPerArena]
//
// Checks the four things that would quietly ruin the game:
//   determinism      -- replay must reproduce a completed match exactly
//   side balance     -- neither end of the pitch may be worth anything
//   termination      -- no match may run forever or end without a result
//   football-shaped  -- scorelines must look like football scorelines

import { simulate, createMatch, step as stepMatch, resultOf } from '../src/sim/match.js';
import { ARENA_META, buildArena, designTension, W as AW, H as AH } from '../src/sim/arenas.js';
import { makeRng } from '../src/core/rng.js';
import { STEP } from '../src/core/physics.js';

const N = Number(process.argv[2] || 400);
const RULES_GROUP = { allowDraw: true, extraTime: false };
const RULES_KO = { allowDraw: false, extraTime: true, penalties: true };

function pct(x) { return (100 * x).toFixed(1) + '%'; }

function run(arenaId, tension, rules, n, seed0) {
  const res = [];
  for (let i = 0; i < n; i++) {
    res.push(simulate({ teams: ['A', 'B'], arenaId, tension, seed: seed0 + i * 7919, rules }));
  }
  return res;
}

let failures = 0;
function check(name, ok, detail) {
  if (!ok) failures++;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  ' + detail : ''}`);
}

console.log(`\nMarble Nations simulation validation  (${N} matches per arena)\n`);

// 1. Determinism ------------------------------------------------------------
console.log('Determinism');
{
  const a = simulate({ teams: ['A', 'B'], arenaId: 'pinball', tension: 0.5, seed: 12345, rules: RULES_KO });
  const b = simulate({ teams: ['A', 'B'], arenaId: 'pinball', tension: 0.5, seed: 12345, rules: RULES_KO });
  check('identical seed -> identical result', JSON.stringify(a) === JSON.stringify(b));

  // Watched (stepped one tick at a time, as the renderer does) vs skipped.
  const m = createMatch({ teams: ['A', 'B'], arenaId: 'bowl', tension: 0.8, seed: 777, rules: RULES_KO });
  let guard = 0;
  while (!m.finished && guard++ < 120 * 600) stepMatch(m);
  const watched = resultOf(m);
  const skipped = simulate({ teams: ['A', 'B'], arenaId: 'bowl', tension: 0.8, seed: 777, rules: RULES_KO });
  check('watched result === skipped result', JSON.stringify(watched) === JSON.stringify(skipped));
}

// 2. Structural symmetry -----------------------------------------------------
//
// The fairness argument is that the map (x,y) -> (W-x, H-y) sends every arena's
// collider set to itself. This checks that directly, which is far stronger than
// waiting for a win-rate to drift: an asymmetric arena fails here immediately
// instead of after ten thousand matches.
//
// Per-side PHASES are excluded: keeper phases are drawn i.i.d. by design, and
// i.i.d. draws preserve exchangeability without preserving instance symmetry.
console.log('\nStructural symmetry (180-degree rotation about the arena centre)');
{
  const rnd = (v) => Math.round(v * 1000) / 1000;

  // Motion canonicalisation. `rot` maps to the same rotation about the image of
  // its centre. `osc` maps to the negated axis. Keepers are the one exception:
  // their phases are deliberately i.i.d. per end, and a free uniform phase
  // absorbs the axis sign (sin and -sin have the same distribution), so for
  // keepers only the axis is compared without its sign.
  const motionKey = (c, mirror) => {
    const m = c.motion;
    if (!m) return '-';
    if (m.kind === 'rot') {
      const cx = mirror ? AW - m.cx : m.cx, cy = mirror ? AH - m.cy : m.cy;
      return `rot:${rnd(cx)},${rnd(cy)},${rnd(m.omega)}`;
    }
    let dx = mirror ? -m.dx : m.dx, dy = mirror ? -m.dy : m.dy;
    if (c.tag === 'keeper') { dx = Math.abs(dx); dy = Math.abs(dy); }
    return `osc:${rnd(dx)},${rnd(dy)},${rnd(m.amp)},${rnd(m.period)}`;
  };
  const gateKey = (c) => c.gate ? `${rnd(c.gate.period)}:${rnd(c.gate.openFrac)}` : '-';
  const common = (c) => `${c.tag}|${rnd(c.rest)}|${rnd(c.kick)}|${rnd(c.friction)}`;
  const key = (c, mirror) => {
    const only = c.only == null ? 'x' : (mirror ? 1 - c.only : c.only);
    if (c.type === 'seg') {
      const pts = mirror
        ? [[AW - c.ax, AH - c.ay], [AW - c.bx, AH - c.by]]
        : [[c.ax, c.ay], [c.bx, c.by]];
      const ends = pts.map(([x, y]) => `${rnd(x)},${rnd(y)}`).sort().join(';');
      return `S|${ends}|${common(c)}|${only}|${motionKey(c, mirror)}|${gateKey(c)}`;
    }
    const x = mirror ? AW - c.x : c.x, y = mirror ? AH - c.y : c.y;
    return `C|${rnd(x)},${rnd(y)},${rnd(c.r)}|${common(c)}|${only}|${motionKey(c, mirror)}`;
  };

  for (const id of Object.keys(ARENA_META)) {
    let worst = null;
    for (let seed = 1; seed <= 12 && !worst; seed++) {
      const a = buildArena(id, makeRng(seed * 7919), designTension(id));
      const have = new Map();
      for (const c of a.colliders) { const k = key(c, false); have.set(k, (have.get(k) || 0) + 1); }
      for (const c of a.colliders) {
        const k = key(c, true);
        if (!have.get(k)) { worst = `${c.tag || c.type} has no 180-degree twin (seed ${seed})`; break; }
        have.set(k, have.get(k) - 1);
      }
      // fields and hazards must pair up too
      for (const list of [a.fields || [], a.drains || []]) {
        const fh = new Map();
        const shape = (f) => `${rnd(f.r ?? 0)},${rnd(f.w ?? 0)},${rnd(f.h ?? 0)}`;
        const fk = (f) => `${rnd(f.x)},${rnd(f.y)},${shape(f)},${rnd(f.strength ?? 0)},${rnd(f.cycle ?? 0)},${rnd(f.onFor ?? 0)},${rnd(f.dirX ?? 0)},${rnd(f.dirY ?? 0)}`;
        const fm = (f) => `${rnd(AW - f.x)},${rnd(AH - f.y)},${shape(f)},${rnd(f.strength ?? 0)},${rnd(f.cycle ?? 0)},${rnd(f.onFor ?? 0)},${rnd(-(f.dirX ?? 0))},${rnd(-(f.dirY ?? 0))}`;
        for (const f of list) fh.set(fk(f), (fh.get(fk(f)) || 0) + 1);
        for (const f of list) {
          if (!fh.get(fm(f))) { worst = `hazard/field at ${rnd(f.x)},${rnd(f.y)} has no twin (seed ${seed})`; break; }
          fh.set(fm(f), fh.get(fm(f)) - 1);
        }
      }
      // spawns must be images of one another
      const k = a.spawns.kickoff, rs = a.spawns.restart;
      if (rnd(k[0].x) !== rnd(AW - k[1].x) || rnd(k[0].y) !== rnd(AH - k[1].y)) worst = 'kick-off spawns are not mirrored';
      if (rnd(rs[0].x) !== rnd(AW - rs[1].x) || rnd(rs[0].y) !== rnd(AH - rs[1].y)) worst = 'restart spawns are not mirrored';
    }
    check(`${ARENA_META[id].name} is 180-degree symmetric`, !worst, worst || '');
  }
}

// 3. Per-arena behaviour -----------------------------------------------------
const rows = [];
for (const id of Object.keys(ARENA_META)) {
  const tension = designTension(id);
  console.log(`\n${ARENA_META[id].name}  (${id}, tension ${tension})`);
  const g = run(id, tension, RULES_GROUP, N, 1000 + id.length * 13);

  const homeW = g.filter(r => r.score[0] > r.score[1]).length;
  const awayW = g.filter(r => r.score[1] > r.score[0]).length;
  const draws = g.length - homeW - awayW;
  const goals = g.reduce((s, r) => s + r.score[0] + r.score[1], 0) / g.length;
  const g0 = g.reduce((s, r) => s + r.score[0], 0) / g.length;
  const g1 = g.reduce((s, r) => s + r.score[1], 0) / g.length;
  const maxG = Math.max(...g.map(r => r.score[0] + r.score[1]));
  const secs = g.map(r => r.ticks * STEP);
  const meanSecs = secs.reduce((a, b) => a + b, 0) / secs.length;

  // Binomial two-sided z on decisive matches only.
  const dec = homeW + awayW;
  const z = dec ? Math.abs(homeW - dec / 2) / Math.sqrt(dec * 0.25) : 0;

  check('no side bias (|z| < 2.6)', z < 2.6, `top ${homeW} / bottom ${awayW} / draw ${draws}  z=${z.toFixed(2)}`);
  check('goals per match in 1.9-3.5', goals >= 1.9 && goals <= 3.5, `${goals.toFixed(2)} (top ${g0.toFixed(2)} / bottom ${g1.toFixed(2)})`);
  check('draw rate in 12-40%', draws / g.length >= 0.12 && draws / g.length <= 0.40, pct(draws / g.length));
  // The highest-scoring World Cup match on record is Austria 7-5 Switzerland in
  // 1954: twelve goals. That is the ceiling. Anything above it reads as a broken
  // simulation rather than a thrashing.
  check('no scoreline above the real record (<= 12 goals)', maxG <= 12, `max ${maxG}`);
  check('watch time under 60s at 1x', Math.max(...secs) <= 60, `${meanSecs.toFixed(1)}s mean, ${Math.max(...secs).toFixed(1)}s max`);
  check('every match terminated', g.every(r => r.decidedBy !== 'unresolved'));

  // Knockout: every tie must produce a winner.
  const k = run(id, tension, RULES_KO, Math.min(N, 250), 55000 + id.length);
  check('every knockout tie resolved', k.every(r => r.winner === 0 || r.winner === 1),
    `aet ${k.filter(r => r.decidedBy === 'aet').length}, pens ${k.filter(r => r.decidedBy === 'pens').length}`);
  const kz = (() => { const h = k.filter(r => r.winner === 0).length; return Math.abs(h - k.length / 2) / Math.sqrt(k.length * 0.25); })();
  check('knockout winner unbiased (|z| < 2.6)', kz < 2.6, `z=${kz.toFixed(2)}`);

  rows.push({ id, goals: goals.toFixed(2), draws: pct(draws / g.length), secs: meanSecs.toFixed(0), z: z.toFixed(2) });
}

// 4. Scoreline shape across all arenas --------------------------------------
console.log('\nScoreline distribution (all arenas pooled)');
{
  const all = [];
  for (const id of Object.keys(ARENA_META)) all.push(...run(id, 0.4, RULES_GROUP, 200, 9000 + id.length * 31));
  const tally = new Map();
  for (const r of all) {
    const k = `${Math.max(...r.score)}-${Math.min(...r.score)}`;
    tally.set(k, (tally.get(k) || 0) + 1);
  }
  const top = [...tally.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  console.log('  ' + top.map(([k, v]) => `${k}: ${pct(v / all.length)}`).join('   '));
  const zeroZero = (tally.get('0-0') || 0) / all.length;
  check('0-0 is uncommon but possible (1-18%)', zeroZero >= 0.01 && zeroZero <= 0.18, pct(zeroZero));
}

console.log('\nSummary');
console.table(rows);
console.log(failures === 0 ? '\nAll checks passed.\n' : `\n${failures} check(s) failed.\n`);
process.exit(failures === 0 ? 0 : 1);

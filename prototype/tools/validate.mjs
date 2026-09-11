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
import { ARENA_META } from '../src/sim/arenas.js';
import { STEP } from '../src/core/physics.js';

const N = Number(process.argv[2] || 400);
const RULES_GROUP = { allowDraw: true, extraTime: false };
const RULES_KO = { allowDraw: false, extraTime: true, penalties: true };
const TENSION = { rotor: 0.2, pinball: 0.2, channels: 0.2, crumble: 0.7, bowl: 0.7, grand: 1 };

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

// 2. Per-arena behaviour -----------------------------------------------------
const rows = [];
for (const id of Object.keys(ARENA_META)) {
  const tension = TENSION[id];
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
  // Real football produces the occasional 7-1. What must not happen is a
  // scoreline that reads as a broken simulation rather than a thrashing.
  check('no absurd scoreline (<= 11 goals)', maxG <= 11, `max ${maxG}`);
  check('watch time 45-90s at 1x', meanSecs >= 45 && meanSecs <= 90, `${meanSecs.toFixed(1)}s mean, ${Math.max(...secs).toFixed(1)}s max`);
  check('every match terminated', g.every(r => r.decidedBy !== 'unresolved'));

  // Knockout: every tie must produce a winner.
  const k = run(id, tension, RULES_KO, Math.min(N, 250), 55000 + id.length);
  check('every knockout tie resolved', k.every(r => r.winner === 0 || r.winner === 1),
    `aet ${k.filter(r => r.decidedBy === 'aet').length}, pens ${k.filter(r => r.decidedBy === 'pens').length}`);
  const kz = (() => { const h = k.filter(r => r.winner === 0).length; return Math.abs(h - k.length / 2) / Math.sqrt(k.length * 0.25); })();
  check('knockout winner unbiased (|z| < 2.6)', kz < 2.6, `z=${kz.toFixed(2)}`);

  rows.push({ id, goals: goals.toFixed(2), draws: pct(draws / g.length), secs: meanSecs.toFixed(0), z: z.toFixed(2) });
}

// 3. Scoreline shape across all arenas --------------------------------------
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

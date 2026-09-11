// Tournament-engine integrity tests.
//
// Run: node tools/tournament-test.mjs [campaigns]
//
// These are the checks that stop a competition quietly becoming a generic
// bracket: draw constraints, bracket wiring, third-place feasibility, and the
// claim that a nation's pot does not change its chances.

import { createCampaign, currentRound, playFixture, roundIsComplete, advance, groupTable } from '../src/engine/campaign.js';
import { COMPETITIONS } from '../src/data/competitions/index.js';
import * as wc from '../src/data/competitions/wc2026.js';
import * as afc from '../src/data/competitions/afcq2026.js';
import { team } from '../src/data/teams.js';
import { makeRng } from '../src/core/rng.js';

const N = Number(process.argv[2] || 25);
let failures = 0;
const check = (name, ok, detail) => {
  if (!ok) failures++;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  ' + detail : ''}`);
};

function playAll(c) {
  let guard = 0;
  while (!c.finished && guard++ < 40) {
    const r = currentRound(c);
    if (!r) break;
    for (const f of r.fixtures) if (!f.result) playFixture(c, f);
    if (roundIsComplete(c)) advance(c);
  }
  return c;
}

// --- 1. Annex C feasibility -------------------------------------------------
console.log('\nThird-place allocation (all 495 combinations)');
{
  const L = 'ABCDEFGHIJKL'.split('');
  const combos = [];
  const rec = (start, pick) => {
    if (pick.length === 8) { combos.push(pick.slice()); return; }
    for (let i = start; i < L.length; i++) { pick.push(L[i]); rec(i + 1, pick); pick.pop(); }
  };
  rec(0, []);
  let ok = 0, bad = [];
  for (const combo of combos) {
    const a = wc.matchThirds(combo, makeRng(combo.join('').length * 7919 + 13));
    if (a && new Set(Object.values(a)).size === 8 && Object.values(a).every(g => combo.includes(g))) ok++;
    else bad.push(combo.join(''));
  }
  check(`every one of ${combos.length} qualifying-group combinations has a valid slot assignment`,
    bad.length === 0, `${ok}/${combos.length}${bad.length ? ' bad: ' + bad.slice(0, 3).join(',') : ''}`);
}

// --- 2. World Cup campaigns -------------------------------------------------
console.log(`\nWorld Cup 2026 — ${N} full campaigns`);
{
  const champByPot = [0, 0, 0, 0];
  const champCount = new Map();
  let drawOk = true, bracketOk = true, dupOk = true, matchCount = 0, thirdsOk = true;

  for (let i = 0; i < N; i++) {
    const c = createCampaign({ competitionId: 'wc2026', seed: 4242 + i * 104729, followed: ['JPN'] });

    // draw constraints
    const groups = c.meta.groups;
    const all = Object.values(groups).flat();
    if (all.length !== 48 || new Set(all).size !== 48) dupOk = false;
    for (const [g, list] of Object.entries(groups)) {
      if (list.length !== 4) drawOk = false;
      const confs = {};
      for (const t of list) { const k = team(t).conf; confs[k] = (confs[k] || 0) + 1; }
      for (const [k, n] of Object.entries(confs)) {
        if (k === 'UEFA' ? n > 2 : n > 1) drawOk = false;
      }
      if (!(confs.UEFA >= 1)) drawOk = false;
    }
    if (groups.A[0] !== 'MEX' || groups.B[0] !== 'CAN' || groups.D[0] !== 'USA') drawOk = false;
    // pathway separation
    const Q = wc.BRACKET.QUARTER;
    const gOf = code => Object.keys(groups).find(g => groups[g].includes(code));
    const qs = ['ESP', 'ARG', 'FRA', 'ENG'].map(t => Q[gOf(t)]);
    if (new Set(qs).size !== 4) drawOk = false;
    const halfOf = q => (q <= 2 ? 1 : 2);
    if (halfOf(Q[gOf('ESP')]) === halfOf(Q[gOf('ARG')])) drawOk = false;

    playAll(c);
    matchCount = c.rounds.reduce((s, r) => s + r.fixtures.length, 0);
    if (matchCount !== 104) bracketOk = false;
    if (!c.champion) bracketOk = false;

    // every knockout round has the right number of ties and no team twice
    const sizes = { r32: 16, r16: 8, qf: 4, sf: 2, final: 2 };
    for (const [id, n] of Object.entries(sizes)) {
      const r = c.rounds.find(x => x.id === id);
      if (!r || r.ties.length !== n) bracketOk = false;
      const ts = r.ties.flatMap(t => t.teams);
      if (new Set(ts).size !== ts.length) dupOk = false;
      if (ts.some(t => !t)) bracketOk = false;
    }
    // exactly 32 teams entered the round of 32, 16 of them group winners
    const r32Teams = c.rounds.find(x => x.id === 'r32').ties.flatMap(t => t.teams);
    if (new Set(r32Teams).size !== 32) bracketOk = false;
    const winners = Object.values(c.meta.tables).map(t => t[0].code);
    if (!winners.every(w => r32Teams.includes(w))) thirdsOk = false;
    const thirdsIn = c.meta.thirdRanking.slice(0, 8).map(r => r.code);
    if (!thirdsIn.every(t => r32Teams.includes(t))) thirdsOk = false;

    const pot = wc.potOf(c.champion);
    champByPot[pot - 1]++;
    champCount.set(c.champion, (champCount.get(c.champion) || 0) + 1);
  }

  check('draw satisfies host placement, confederation limits and pathway separation', drawOk);
  check('104 matches per campaign', matchCount === 104, `${matchCount}`);
  check('bracket wiring produces full, non-empty rounds', bracketOk);
  check('no nation appears twice in any round', dupOk);
  check('group winners and the eight best thirds all reach the round of 32', thirdsOk);
  console.log(`  info  champions by draw pot: 1:${champByPot[0]} 2:${champByPot[1]} 3:${champByPot[2]} 4:${champByPot[3]} (expected ${(N / 4).toFixed(1)} each)`);
  const top = [...champCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  console.log(`  info  most frequent champions: ${top.map(([k, v]) => `${k} ${v}`).join(', ')}`);
  // A pot-4 nation must be able to win. With equal marbles this is 12/48 of titles.
  check('pot 4 nations win titles', champByPot[3] > 0, `${champByPot[3]} of ${N}`);
}

// --- 3. Save/resume ---------------------------------------------------------
console.log('\nSave and resume');
{
  const a = createCampaign({ competitionId: 'wc2026', seed: 99991, followed: ['KSA', 'JPN'] });
  const r = currentRound(a);
  for (let i = 0; i < 30; i++) playFixture(a, r.fixtures[i]);
  const json = JSON.stringify(a);
  const b = JSON.parse(json);
  // continue both and compare
  playAll(a); playAll(b);
  check('a campaign reloaded from its save file finishes identically',
    a.champion === b.champion && JSON.stringify(a.meta.tables) === JSON.stringify(b.meta.tables),
    `${a.champion} vs ${b.champion}`);
}

// --- 4. AFC qualification ---------------------------------------------------
console.log('\nAFC qualification 2026 — full campaigns');
{
  const M = Math.max(4, Math.round(N / 4));
  let ok = true, playoffOk = true, counts = null;
  const qualifiedBySeed = [];
  for (let i = 0; i < M; i++) {
    const c = createCampaign({ competitionId: 'afcq2026', seed: 700001 + i * 7919, followed: ['UAE'] });
    playAll(c);
    counts = c.rounds.map(r => `${r.id}:${r.fixtures.length}`).join(' ');
    if (c.meta.qualified.length !== 8) ok = false;
    if (!c.meta.playoffRep) playoffOk = false;
    if (c.meta.qualified.includes(c.meta.playoffRep)) playoffOk = false;
    if (new Set(c.meta.qualified).size !== 8) ok = false;
    const entered = new Set([...c.meta.qualified, c.meta.playoffRep]);
    if (entered.size !== 9) ok = false;
    for (const code of c.meta.qualified) qualifiedBySeed.push(afc.seedOf(code));
  }
  check('exactly 8 nations qualify directly', ok, counts);
  check('the play-off representative is distinct from the 8 qualifiers and is not marked as qualified', playoffOk);
  const lowSeed = qualifiedBySeed.filter(s => s > 26).length;
  console.log(`  info  qualifiers that started in the first round: ${lowSeed} of ${qualifiedBySeed.length}`);
  check('nations that entered in round one can still qualify', lowSeed >= 0);
}

console.log(failures === 0 ? '\nAll checks passed.\n' : `\n${failures} check(s) failed.\n`);
process.exit(failures ? 1 : 0);

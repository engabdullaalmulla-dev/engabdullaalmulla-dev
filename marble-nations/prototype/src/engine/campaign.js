// Campaign state: the saved journey through one edition of one competition.
//
// A campaign stores seeds and results, not frames. Every match in it can be
// re-created exactly from (campaign seed, round id, fixture id), which is what
// makes Replay honest and save files tiny.

import { makeRng, seedFor } from '../core/rng.js';
import { simulate, SIM_VERSION } from '../sim/match.js';
import { arenaPoolForStage, tensionForStage, ARENA_META } from '../sim/arenas.js';
import { buildTable, rankTeams } from './standings.js';
import { COMPETITIONS } from '../data/competitions/index.js';

export const SAVE_VERSION = 3;

export function createCampaign({ competitionId, mode = 'authentic', followed = [], seed, name }) {
  const comp = COMPETITIONS[competitionId];
  if (!comp) throw new Error('unknown competition: ' + competitionId);
  const s = (seed ?? (Date.now() ^ (Math.random() * 0x7fffffff))) >>> 0;
  const c = {
    v: SAVE_VERSION,
    id: 'c' + s.toString(36) + Date.now().toString(36).slice(-4),
    competitionId, edition: comp.meta.edition,
    rulesetVersion: comp.meta.rulesetVersion,
    simVersion: SIM_VERSION,
    mode, seed: s, followed: followed.slice(), name: name || comp.meta.name,
    created: Date.now(), updated: Date.now(),
    lives: mode === 'arcade' ? 3 : 0,
    livesUsed: 0,
    rounds: [], current: 0,
    finished: false, champion: null,
    meta: {},
    history: [],
  };
  comp.start(c, makeRng(seedFor(c.seed, 'start')));
  return c;
}

export function competitionOf(c) { return COMPETITIONS[c.competitionId]; }
export function currentRound(c) { return c.rounds[c.current] || null; }

export function roundById(c, id) { return c.rounds.find(r => r.id === id); }

// --- fixtures ---------------------------------------------------------------

export function makeFixture(c, round, { id, teams, label, group, tieId, leg, matchday, index }) {
  const totalRounds = competitionOf(c).meta.knockoutRounds || 1;
  const kind = round.kind === 'groups' ? 'group' : 'ko';
  const pool = arenaPoolForStage(kind, round.roundIndex ?? 0, totalRounds);
  const seed = seedFor(c.seed, round.id, id);
  const rng = makeRng(seed);
  return {
    id, roundId: round.id, teams: teams.slice(), label, group, tieId, leg, matchday,
    index: index ?? 0,
    arenaId: rng.pick(pool),
    tension: round.tension ?? tensionForStage(kind, round.roundIndex ?? 0, totalRounds),
    seed,
    result: null,
  };
}

export function matchConfigFor(c, fixture) {
  const round = roundById(c, fixture.roundId);
  const tie = fixture.tieId ? round.ties.find(t => t.id === fixture.tieId) : null;
  const rules = {
    allowDraw: round.kind === 'groups' || (tie && tie.legs === 2 && fixture.leg === 1),
    extraTime: round.kind !== 'groups',
    penalties: round.kind !== 'groups',
  };
  let tieCtx = null;
  if (tie && tie.legs === 2 && fixture.leg === 2) {
    const first = round.fixtures.find(f => f.tieId === tie.id && f.leg === 1);
    const before = [0, 0];
    if (first && first.result) {
      const flip = first.teams[0] !== fixture.teams[0];
      before[0] = flip ? first.result.score[1] : first.result.score[0];
      before[1] = flip ? first.result.score[0] : first.result.score[1];
    }
    tieCtx = { leg: 2, before };
  }
  return {
    teams: fixture.teams.slice(),
    arenaId: fixture.arenaId,
    tension: fixture.tension,
    seed: fixture.seed,
    rules, tie: tieCtx,
  };
}

export function playFixture(c, fixture, result) {
  fixture.result = result || simulate(matchConfigFor(c, fixture));
  c.updated = Date.now();
  return fixture.result;
}

export function nextFixture(c, { followedFirst = true } = {}) {
  const r = currentRound(c);
  if (!r) return null;
  const pending = r.fixtures.filter(f => !f.result);
  if (!pending.length) return null;
  const md = Math.min(...pending.map(f => f.matchday ?? 0));
  const wave = pending.filter(f => (f.matchday ?? 0) === md);
  if (followedFirst) {
    const mine = wave.find(f => f.teams.some(t => c.followed.includes(t)));
    if (mine) return mine;
  }
  return wave[0];
}

// Every fixture in the current matchday that is not the one being watched.
export function siblingsOf(c, fixture) {
  const r = currentRound(c);
  return r.fixtures.filter(f => f !== fixture && !f.result && (f.matchday ?? 0) === (fixture.matchday ?? 0));
}

export function playRestOfMatchday(c, fixture) {
  for (const f of siblingsOf(c, fixture)) playFixture(c, f);
}

export function roundIsComplete(c) {
  const r = currentRound(c);
  return !!r && r.fixtures.every(f => f.result);
}

export function advance(c) {
  const comp = competitionOf(c);
  const next = comp.advance(c, makeRng(seedFor(c.seed, 'advance', c.current)));
  if (!next) { c.finished = true; return null; }
  c.rounds.push(next);
  c.current = c.rounds.length - 1;
  return next;
}

// --- group scenarios --------------------------------------------------------
//
// Used for the plain-language consequence line after every match. It enumerates
// the remaining permutations in the team's own group, which is exactly how a
// broadcast talks about qualification -- "needs a point", "can still go through
// as a best third".

export function groupScenario(c, groupName) {
  const round = c.rounds.find(r => r.kind === 'groups' && r.groups && r.groups[groupName]);
  if (!round) return null;
  const comp = competitionOf(c);
  const codes = round.groups[groupName];
  const played = round.fixtures.filter(f => f.group === groupName && f.result);
  const left = round.fixtures.filter(f => f.group === groupName && !f.result);
  const chain = comp.meta.groupTiebreakers;
  const rng = makeRng(seedFor(c.seed, 'scenario', groupName));

  const can2 = new Set(), can3 = new Set(), always2 = new Set(codes), always3 = new Set(codes);
  const combos = Math.pow(3, left.length);
  const CAP = 3 ** 8;
  const sample = combos <= CAP;

  const evaluate = (fakes) => {
    const table = rankTeams(codes, played.concat(fakes), chain, rng, comp.meta.points);
    const top2 = new Set(table.slice(0, 2).map(r => r.code));
    const top3 = new Set(table.slice(0, 3).map(r => r.code));
    for (const code of codes) {
      if (top2.has(code)) can2.add(code); else always2.delete(code);
      if (top3.has(code)) can3.add(code); else always3.delete(code);
    }
  };

  if (!sample) { evaluate([]); }
  else {
    for (let mask = 0; mask < combos; mask++) {
      let m = mask;
      const fakes = left.map(f => {
        const o = m % 3; m = (m / 3) | 0;
        return { teams: f.teams, result: { score: o === 0 ? [1, 0] : o === 1 ? [0, 1] : [0, 0] } };
      });
      evaluate(fakes);
    }
  }
  return { can2, can3, always2, always3, remaining: left.length };
}

export function consequenceFor(c, fixture, code) {
  const comp = competitionOf(c);
  const round = roundById(c, fixture.roundId);
  if (!round) return '';
  // A competition may override the wording where "the next round" is wrong --
  // a final has no next round, and a third-place play-off is not elimination.
  if (comp.consequence) {
    const custom = comp.consequence(c, fixture, code, round);
    if (custom) return custom;
  }
  if (round.kind === 'groups') {
    const sc = groupScenario(c, fixture.group);
    if (!sc) return '';
    if (sc.remaining === 0) {
      const table = groupTable(c, round, fixture.group);
      const pos = table.findIndex(r => r.code === code) + 1;
      if (pos <= 2) return `Through as ${pos === 1 ? 'group winner' : 'runner-up'}.`;
      if (pos === 3) return 'Third place — now waiting on the other groups.';
      return 'Eliminated in the group stage.';
    }
    if (sc.always2.has(code)) return 'Qualified for the knockout stage with a match to spare.';
    if (!sc.can2.has(code) && !sc.can3.has(code)) return 'Eliminated — cannot finish in the top three.';
    if (!sc.can2.has(code)) return 'Out of the top two, but third place could still be enough.';
    if (sc.always3.has(code)) return 'Guaranteed at least third. Still in contention.';
    return 'Still in contention.';
  }
  // knockout
  const tie = round.ties.find(t => t.id === fixture.tieId);
  if (!tie) return '';
  if (tie.legs === 2 && fixture.leg === 1) return 'First leg done. The tie is decided next time out.';
  if (tie.winner == null) return 'Tie still level.';
  const won = tie.winner === code;
  const how = fixture.result.decidedBy;
  const suffix = how === 'pens' ? ' on penalties' : how === 'aet' ? ' after extra time' : tie.legs === 2 ? ' on aggregate' : '';
  if (!won) return `Eliminated${suffix}.`;
  const label = comp.nextRoundLabel ? comp.nextRoundLabel(round.id) : 'the next round';
  return `Through to ${label}${suffix}.`;
}

export function groupTable(c, round, groupName) {
  const comp = competitionOf(c);
  const codes = round.groups[groupName];
  const ms = round.fixtures.filter(f => f.group === groupName);
  const rng = makeRng(seedFor(c.seed, 'table', groupName));
  return rankTeams(codes, ms, comp.meta.groupTiebreakers, rng, comp.meta.points);
}

export function allTablesFor(c, round) {
  const out = {};
  for (const g of Object.keys(round.groups || {})) out[g] = groupTable(c, round, g);
  return out;
}

export function isEliminated(c, code) {
  for (let i = c.rounds.length - 1; i >= 0; i--) {
    const r = c.rounds[i];
    if (r.eliminated && r.eliminated.includes(code)) return r.label;
  }
  return null;
}

export function aliveFollowed(c) {
  return c.followed.filter(t => !isEliminated(c, t));
}

export function stillIn(c) {
  const r = currentRound(c);
  if (!r) return [];
  if (r.kind === 'groups') return Object.values(r.groups).flat();
  return r.ties.flatMap(t => t.teams).filter(Boolean);
}

export function arenaName(id) { return (ARENA_META[id] || {}).name || id; }
export { buildTable };

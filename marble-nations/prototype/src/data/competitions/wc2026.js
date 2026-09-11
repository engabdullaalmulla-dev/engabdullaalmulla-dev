// FIFA World Cup 2026 -- finals tournament.
//
// Ruleset version 2026.1. Every structural claim below is sourced in
// docs/04-competition-rulesets.md. Anything we could not confirm from a
// published source is listed in `meta.flags` and surfaced in the app's ruleset
// sheet rather than quietly assumed.

import { drawGroups } from '../../engine/draw.js';
import { makeFixture } from '../../engine/campaign.js';
import { rankTeams } from '../../engine/standings.js';
import { team } from '../teams.js';
import { makeRng, seedFor } from '../../core/rng.js';

const LETTERS = 'ABCDEFGHIJKL'.split('');

// The 48-team field as it was actually constituted for this edition: the 42
// teams allocated to pots on the FIFA ranking of 19 November 2025, plus the six
// play-off winners. We re-run the DRAW and every MATCH; we do not re-run
// qualification, because this competition is the finals tournament.
const POTS = [
  ['CAN', 'MEX', 'USA', 'ESP', 'ARG', 'FRA', 'ENG', 'BRA', 'POR', 'NED', 'BEL', 'GER'],
  ['CRO', 'MAR', 'COL', 'URU', 'SUI', 'JPN', 'SEN', 'IRN', 'KOR', 'ECU', 'AUT', 'AUS'],
  ['NOR', 'PAN', 'EGY', 'ALG', 'SCO', 'PAR', 'TUN', 'CIV', 'UZB', 'QAT', 'KSA', 'RSA'],
  ['JOR', 'CPV', 'GHA', 'CUW', 'HAI', 'NZL', 'BIH', 'CZE', 'SWE', 'TUR', 'COD', 'IRQ'],
];

// Hosts are placed, not drawn.
const FIXED = { MEX: 'A', CAN: 'B', USA: 'D' };

// Which quarter of the knockout bracket each group's winner slot feeds. Derived
// from the published round-of-32 pairings below, not assumed.
const QUARTER = { C: 1, E: 1, F: 1, A: 2, I: 2, L: 2, D: 3, G: 3, H: 3, B: 4, J: 4, K: 4 };
const HALF = { 1: 1, 2: 1, 3: 2, 4: 2 };

// Published round-of-32 structure. `from` is the set of groups whose
// third-placed team may occupy that slot.
const R32 = [
  { m: 73, a: { t: 'ru', g: 'A' }, b: { t: 'ru', g: 'B' } },
  { m: 74, a: { t: 'w', g: 'E' }, b: { t: '3', from: ['A', 'B', 'C', 'D', 'F'] } },
  { m: 75, a: { t: 'w', g: 'F' }, b: { t: 'ru', g: 'C' } },
  { m: 76, a: { t: 'w', g: 'C' }, b: { t: 'ru', g: 'F' } },
  { m: 77, a: { t: 'w', g: 'I' }, b: { t: '3', from: ['C', 'D', 'F', 'G', 'H'] } },
  { m: 78, a: { t: 'ru', g: 'E' }, b: { t: 'ru', g: 'I' } },
  { m: 79, a: { t: 'w', g: 'A' }, b: { t: '3', from: ['C', 'E', 'F', 'H', 'I'] } },
  { m: 80, a: { t: 'w', g: 'L' }, b: { t: '3', from: ['E', 'H', 'I', 'J', 'K'] } },
  { m: 81, a: { t: 'w', g: 'D' }, b: { t: '3', from: ['B', 'E', 'F', 'I', 'J'] } },
  { m: 82, a: { t: 'w', g: 'G' }, b: { t: '3', from: ['A', 'E', 'H', 'I', 'J'] } },
  { m: 83, a: { t: 'ru', g: 'K' }, b: { t: 'ru', g: 'L' } },
  { m: 84, a: { t: 'w', g: 'H' }, b: { t: 'ru', g: 'J' } },
  { m: 85, a: { t: 'w', g: 'B' }, b: { t: '3', from: ['E', 'F', 'G', 'I', 'J'] } },
  { m: 86, a: { t: 'w', g: 'J' }, b: { t: 'ru', g: 'H' } },
  { m: 87, a: { t: 'w', g: 'K' }, b: { t: '3', from: ['D', 'E', 'I', 'J', 'L'] } },
  { m: 88, a: { t: 'ru', g: 'D' }, b: { t: 'ru', g: 'G' } },
];

const LINKS = {
  r16: [[73, 74, 89], [75, 76, 90], [77, 78, 91], [79, 80, 92], [81, 82, 93], [83, 84, 94], [85, 86, 95], [87, 88, 96]],
  qf: [[89, 90, 97], [91, 92, 98], [93, 94, 99], [95, 96, 100]],
  sf: [[97, 98, 101], [99, 100, 102]],
};

const ROUND_LABEL = { group: 'Group stage', r32: 'Round of 32', r16: 'Round of 16', qf: 'Quarter-finals', sf: 'Semi-finals', final: 'Final' };
const NEXT_LABEL = { r32: 'the round of 16', r16: 'the quarter-finals', qf: 'the semi-finals', sf: 'the final' };

export const meta = {
  id: 'wc2026',
  name: 'World Cup Finals',
  shortName: 'World Cup 26',
  edition: 2026,
  category: 'Senior men’s international',
  rulesetVersion: '2026.1',
  status: 'playable',
  blurb: '48 nations. Twelve groups of four. The eight best third-placed teams survive. Seven matches from the draw to the trophy.',
  entrantsNote: 'The 48 finalists of this edition, in their published draw pots. Qualification is not re-run — this competition begins at the finals.',
  teams: 48,
  knockoutRounds: 5,
  points: { win: 3, draw: 1, loss: 0 },
  groupTiebreakers: ['pts', 'gd', 'gf', 'h2h:pts', 'h2h:gd', 'h2h:gf', 'fairplay', 'lots'],
  thirdTiebreakers: ['pts', 'gd', 'gf', 'fairplay', 'lots'],
  knockout: { extraTime: true, penalties: true, legs: 1 },
  sources: [
    { label: 'FIFA — how the 48-team World Cup 26 works', url: 'https://www.fifa.com/en/articles/article-fifa-world-cup-2026-mexico-canada-usa-new-format-tournament-football-soccer' },
    { label: 'FIFA — Final Draw procedures and pots', url: 'https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/procedures-pots-final-draw' },
    { label: 'FIFA — knockout stage match schedule and bracket', url: 'https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/knockout-stage-match-schedule-bracket' },
    { label: 'Wikipedia — 2026 FIFA World Cup draw', url: 'https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_draw' },
    { label: 'Wikipedia — 2026 FIFA World Cup knockout stage', url: 'https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_knockout_stage' },
  ],
  flags: [
    { id: 'annex-c', level: 'derived',
      text: 'The eight third-placed teams are matched to their round-of-32 slots by constraint solving, not from FIFA’s published Annex C table. Every assignment is valid under the published slot constraints, and the test suite checks that all 495 possible combinations of qualifying groups can be matched — but a specific pairing may differ from the official table.' },
    { id: 'fair-play', level: 'not-modelled',
      text: 'Fair-play points sit in the tiebreaker chain exactly where the regulations put them, but marble matches produce no cards, so that step can never separate two teams. Ties reaching it fall through to a drawing of lots, which the app says out loud.' },
    { id: 'slot-pattern', level: 'partly-verified',
      text: 'Within-group positions are fixed by pot rather than drawn. The published pattern for groups A, D, G and J (position 2 from pot 3, position 3 from pot 2, position 4 from pot 4) is implemented; the other eight groups use pot order as a placeholder. It affects the order fixtures are played in and nothing else.' },
    { id: 'no-venues', level: 'out-of-scope',
      text: 'Host cities, kick-off times, travel and rest days are not modelled, and there is no home advantage anywhere in the simulation.' },
  ],
};

export function eligible() { return POTS.flat(); }
export function entryStage(code) { return POTS.flat().includes(code) ? 'finals' : null; }
export function potOf(code) { const i = POTS.findIndex(p => p.includes(code)); return i < 0 ? null : i + 1; }

// --- start: the draw --------------------------------------------------------

// `opts.pots` lets another competition supply a different 48-team field in the
// published pot shape -- Road to Glory substitutes the Asian qualifiers it
// actually produced for the ones who qualified in real life.
// `opts.push === false` returns the round instead of pushing it, so the finals
// can be handed back as the next round of a longer campaign.
export function start(c, rng, opts = {}) {
  const pots = opts.pots || POTS;
  const drawn = drawGroups({
    groupNames: LETTERS,
    pots,
    fixed: FIXED,
    confOf: code => team(code).conf,
    defaultConfMax: 1,
    confMax: { UEFA: 2 },
    confMin: { UEFA: 1 },
    // The pathway separation applies to the four highest-ranked teams, all of
    // whom sit in pot 1 and none of whom change in Road to Glory.
    separation: [
      { codes: ['ESP', 'ARG', 'FRA', 'ENG'].filter(t => pots[0].includes(t)), by: 'quarter' },
      { codes: ['ESP', 'ARG'].filter(t => pots[0].includes(t)), by: 'half' },
    ],
    zoneOf: (g, by) => (by === 'quarter' ? QUARTER[g] : HALF[QUARTER[g]]),
    slotPattern: Object.fromEntries(LETTERS.map(g => [g, ['A', 'D', 'G', 'J'].includes(g) ? [0, 2, 1, 3] : [0, 1, 2, 3]])),
  }, rng);

  c.meta.pots = pots;
  c.meta.drawSteps = drawn.steps;
  c.meta.groups = drawn.groups;
  c.meta.winners = {};
  c.meta.losers = {};

  const round = {
    id: 'group', label: ROUND_LABEL.group, kind: 'groups', roundIndex: 0, tension: 0.15,
    groups: drawn.groups, fixtures: [], eliminated: [],
    tiebreakers: meta.groupTiebreakers, advance: 2, totalRounds: meta.knockoutRounds,
    leg: 'finals',
  };
  const SCHED = [[[0, 1], [2, 3]], [[0, 2], [3, 1]], [[3, 0], [1, 2]]];
  for (let md = 0; md < 3; md++) {
    for (const g of LETTERS) {
      const t = drawn.groups[g];
      for (const [i, j] of SCHED[md]) {
        round.fixtures.push(makeFixture(c, round, {
          id: `g-${g}-${md + 1}-${i}${j}`,
          teams: [t[i], t[j]],
          label: `Group ${g} · Matchday ${md + 1}`,
          group: g, matchday: md + 1,
        }));
      }
    }
  }
  if (opts.push === false) return round;
  c.rounds.push(round);
  c.current = 0;
  return round;
}

// --- third-place allocation -------------------------------------------------

export function matchThirds(groupsIn, rng) {
  const slots = R32.filter(x => x.b.t === '3').map(x => ({ m: x.m, from: x.b.from }));
  const avail = new Set(groupsIn);

  function feasible(idx, pool) {
    if (idx >= slots.length) return true;
    for (const g of slots[idx].from) {
      if (!pool.has(g)) continue;
      pool.delete(g);
      const ok = feasible(idx + 1, pool);
      pool.add(g);
      if (ok) return true;
    }
    return false;
  }

  const assign = {};
  for (let i = 0; i < slots.length; i++) {
    const options = rng.shuffle(slots[i].from.filter(g => avail.has(g)));
    let chosen = null;
    for (const g of options) {
      avail.delete(g);
      if (feasible(i + 1, avail)) { chosen = g; break; }
      avail.add(g);
    }
    if (!chosen) return null;
    assign[slots[i].m] = chosen;
  }
  return assign;
}

// --- advance ----------------------------------------------------------------

function tiesToRound(c, id, label, roundIndex, ties) {
  const round = { id, label, kind: 'ties', roundIndex, ties: [], fixtures: [], eliminated: [], leg: 'finals', totalRounds: meta.knockoutRounds };
  ties.forEach((t, i) => {
    const tie = { id: `m${t.m}`, matchNo: t.m, teams: [t.a, t.b], legs: 1, label, winner: null };
    round.ties.push(tie);
    round.fixtures.push(makeFixture(c, round, {
      id: `f${t.m}`, teams: [t.a, t.b], label, tieId: tie.id, leg: 1, matchday: 1, index: i,
    }));
  });
  return round;
}

function summarise(f) {
  const [a, b] = f.result.score;
  let s = `${a}-${b}`;
  if (f.result.decidedBy === 'aet') s += ' (aet)';
  if (f.result.pens) s += ` (${f.result.pens[0]}-${f.result.pens[1]} pens)`;
  return s;
}

function closeKnockoutRound(c, round) {
  for (const tie of round.ties) {
    const f = round.fixtures.find(x => x.tieId === tie.id);
    if (!f || !f.result) continue;
    tie.winner = f.teams[f.result.winner];
    tie.loser = f.teams[1 - f.result.winner];
    tie.summary = summarise(f);
    c.meta.winners[tie.matchNo] = tie.winner;
    c.meta.losers[tie.matchNo] = tie.loser;
    if (!round.eliminated.includes(tie.loser)) round.eliminated.push(tie.loser);
  }
}

export function advance(c, rng) {
  const round = c.rounds[c.current];

  if (round.id === 'group') {
    const tables = {};
    for (const g of LETTERS) {
      tables[g] = rankTeams(round.groups[g], round.fixtures.filter(f => f.group === g),
        meta.groupTiebreakers, makeRng(seedFor(c.seed, 'table', round.id, g)), meta.points);
    }
    c.meta.tables = tables;

    const lots = rng.shuffle(LETTERS);
    const ranked = LETTERS.map(g => ({ ...tables[g][2], group: g }))
      .sort((x, y) => y.pts - x.pts || y.gd - x.gd || y.gf - x.gf || (lots.indexOf(x.group) - lots.indexOf(y.group)))
      .map((r, i) => ({ ...r, pos: i + 1 }));
    c.meta.thirdRanking = ranked;

    const qualifiedGroups = ranked.slice(0, 8).map(r => r.group);
    const assign = matchThirds(qualifiedGroups, rng);
    if (!assign) throw new Error('third-place allocation failed');
    c.meta.thirdSlots = assign;

    round.eliminated = LETTERS.flatMap(g => {
      const out = [tables[g][3].code];
      if (!qualifiedGroups.includes(g)) out.push(tables[g][2].code);
      return out;
    });

    const pick = (x, slot) => {
      if (slot.t === 'w') return tables[slot.g][0].code;
      if (slot.t === 'ru') return tables[slot.g][1].code;
      return tables[assign[x.m]][2].code;
    };
    const ties = R32.map(x => ({ m: x.m, a: pick(x, x.a), b: pick(x, x.b) }));
    return tiesToRound(c, 'r32', ROUND_LABEL.r32, 1, ties);
  }

  closeKnockoutRound(c, round);
  const W = c.meta.winners, L = c.meta.losers;

  if (round.id === 'r32') return tiesToRound(c, 'r16', ROUND_LABEL.r16, 2, LINKS.r16.map(([x, y, m]) => ({ m, a: W[x], b: W[y] })));
  if (round.id === 'r16') return tiesToRound(c, 'qf', ROUND_LABEL.qf, 3, LINKS.qf.map(([x, y, m]) => ({ m, a: W[x], b: W[y] })));
  if (round.id === 'qf') return tiesToRound(c, 'sf', ROUND_LABEL.sf, 4, LINKS.sf.map(([x, y, m]) => ({ m, a: W[x], b: W[y] })));
  if (round.id === 'sf') {
    const r = tiesToRound(c, 'final', ROUND_LABEL.final, 5, [
      { m: 103, a: L[101], b: L[102] },
      { m: 104, a: W[101], b: W[102] },
    ]);
    r.ties[0].label = r.fixtures[0].label = 'Third-place play-off';
    r.ties[1].label = r.fixtures[1].label = 'Final';
    r.fixtures[0].arenaId = 'bowl';
    r.fixtures[0].matchday = 1;
    r.fixtures[1].arenaId = 'grand';   // the final always gets the final's arena
    r.fixtures[1].tension = 1;
    r.fixtures[1].matchday = 2;
    return r;
  }
  if (round.id === 'final') {
    c.champion = W[104];
    c.meta.runnerUp = L[104];
    c.meta.third = W[103];
    return null;
  }
  return null;
}

export function nextRoundLabel(id) { return NEXT_LABEL[id] || 'the next round'; }

// The last round is two different matches and neither is "the next round".
export function consequence(c, fixture, code, round) {
  if (round.id !== 'final' || !fixture.result) return null;
  const won = fixture.teams[fixture.result.winner] === code;
  const how = fixture.result.decidedBy === 'pens' ? ' on penalties'
    : fixture.result.decidedBy === 'aet' ? ' after extra time' : '';
  if (fixture.label === 'Third-place play-off') {
    return won ? `Third place${how}.` : `Fourth place${how}.`;
  }
  return won ? `World champions${how}.` : `Runners-up — beaten in the final${how}.`;
}
export const BRACKET = { R32, LINKS, QUARTER, ROUND_LABEL, LETTERS };
export { POTS };

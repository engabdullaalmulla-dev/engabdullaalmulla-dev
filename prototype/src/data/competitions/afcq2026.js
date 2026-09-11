// AFC qualification for the 2026 FIFA World Cup -- the full five-round journey.
//
// Ruleset version 2026.1. The point of encoding this competition properly is
// that it is NOT a bracket with an Asian label on it. Forty-six nations enter at
// two different stages; eight of them qualify directly; a ninth wins only the
// right to play an inter-confederation play-off, which is not the same thing and
// the app never says it is.

import { drawPotsSimple } from '../../engine/draw.js';
import { makeFixture } from '../../engine/campaign.js';
import { rankTeams, aggregate } from '../../engine/standings.js';
import { makeRng, seedFor } from '../../core/rng.js';

// Seeding order used for every draw in this competition. See flag `seed-order`.
const SEEDS = [
  'JPN', 'IRN', 'KOR', 'AUS', 'QAT', 'KSA', 'IRQ', 'UAE', 'UZB', 'OMA',
  'JOR', 'CHN', 'BHR', 'SYR', 'PLE', 'VIE', 'KGZ', 'LBN', 'IND', 'THA',
  'TJK', 'PRK', 'MAS', 'IDN', 'PHI', 'TKM',
  'HKG', 'MYA', 'SGP', 'KUW', 'AFG', 'YEM', 'TPE', 'MDV', 'NEP', 'BAN',
  'MNG', 'SRI', 'CAM', 'LAO', 'MAC', 'BRU', 'TLS', 'BHU', 'PAK', 'GUM',
];

const R2_GROUPS = 'ABCDEFGHI'.split('');
const R3_GROUPS = 'ABC'.split('');
const R4_GROUPS = 'AB'.split('');

const LABEL = {
  r1: 'First round', r2: 'Second round', r3: 'Third round',
  r4: 'Fourth round', r5: 'Fifth round',
};

export const meta = {
  id: 'afcq2026',
  name: 'Asian Qualification',
  shortName: 'AFC Qualifiers 26',
  edition: 2026,
  category: 'Senior men’s international',
  rulesetVersion: '2026.1',
  status: 'playable',
  blurb: 'Forty-six nations, five rounds, two years. Eight places at the World Cup and one ticket to the inter-confederation play-off.',
  entrantsNote: 'All 46 AFC entrants. The 20 lowest-seeded nations start in the first round; the other 26 enter in the second.',
  teams: 46,
  knockoutRounds: 3,
  points: { win: 3, draw: 1, loss: 0 },
  // AFC competition regulations settle level teams on the results between them
  // BEFORE overall goal difference. This is a real difference from FIFA's chain
  // and it changes who goes through, so it is encoded per edition, not shared.
  groupTiebreakers: ['h2h:pts', 'h2h:gd', 'h2h:gf', 'gd', 'gf', 'wins', 'fairplay', 'lots'],
  thirdTiebreakers: ['pts', 'gd', 'gf', 'fairplay', 'lots'],
  knockout: { extraTime: true, penalties: true, legs: 2 },
  outcomes: [
    { id: 'qualified', label: 'Qualified for the World Cup' },
    { id: 'playoff', label: 'Reached the inter-confederation play-off' },
    { id: 'out', label: 'Eliminated' },
  ],
  sources: [
    { label: 'Wikipedia — 2026 FIFA World Cup qualification (AFC)', url: 'https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_qualification_(AFC)' },
    { label: 'Wikipedia — AFC second round', url: 'https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_qualification_%E2%80%93_AFC_second_round' },
    { label: 'Wikipedia — AFC third round', url: 'https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_qualification_%E2%80%93_AFC_third_round' },
  ],
  flags: [
    { id: 'seed-order', level: 'approximate',
      text: 'The 1–46 seeding order is an approximation of the FIFA ranking that was used for the real draws. It decides which 20 nations start in the first round and how the pots are filled. This is the one part of this ruleset not confirmed against a primary source, and it is the first thing to replace before release.' },
    { id: 'playoff-scope', level: 'by-design',
      text: 'AFC qualification ends at the fifth round, and so does this competition. The inter-confederation play-off is a separate FIFA tournament, not an AFC one: a campaign that reaches it ends with "Reached the inter-confederation play-off", which is explicitly NOT qualification. Play Road to Glory to contest that play-off and go on to the finals.' },
    { id: 'asian-cup', level: 'out-of-scope',
      text: 'The first two rounds also doubled as 2027 Asian Cup qualification in real life. That consequence is shown as information on the results screen but no Asian Cup campaign is generated.' },
    { id: 'r4-venue', level: 'partly-verified',
      text: 'The fourth round is modelled as two single round-robin groups of three at a centralised venue, which matches the published format. Which nation hosts, and the resulting schedule, are not modelled — and there is no home advantage in the simulation regardless.' },
  ],
};

export function eligible() { return SEEDS.slice(); }
export function seedOf(code) { return SEEDS.indexOf(code) + 1; }
export function entryStage(code) {
  const s = seedOf(code);
  if (s <= 0) return null;
  return s <= 26 ? 'r2' : 'r1';
}
export function entryStageLabel(code) {
  return entryStage(code) === 'r1' ? 'First round (two legs)' : 'Second round (groups)';
}

// --- scheduling helpers -----------------------------------------------------

// Circle method: a full single round robin as a list of matchdays.
function roundRobin(teams) {
  const list = teams.slice();
  if (list.length % 2) list.push(null);
  const n = list.length;
  const days = [];
  for (let r = 0; r < n - 1; r++) {
    const day = [];
    for (let i = 0; i < n / 2; i++) {
      const a = list[i], b = list[n - 1 - i];
      if (a && b) day.push(r % 2 === 0 ? [a, b] : [b, a]);
    }
    days.push(day);
    list.splice(1, 0, list.pop());
  }
  return days;
}

function homeAndAway(teams) {
  const first = roundRobin(teams);
  const second = first.map(day => day.map(([a, b]) => [b, a]));
  return first.concat(second);
}

function groupRound(c, id, label, roundIndex, groups, legs) {
  const round = {
    id, label, kind: 'groups', roundIndex, groups, legs, fixtures: [], eliminated: [],
    tiebreakers: meta.groupTiebreakers, advance: id === 'r4' ? 1 : 2,
    totalRounds: meta.knockoutRounds, leg: 'qualifying',
  };
  for (const g of Object.keys(groups)) {
    const days = legs === 2 ? homeAndAway(groups[g]) : roundRobin(groups[g]);
    days.forEach((day, md) => {
      day.forEach(([a, b], i) => {
        round.fixtures.push(makeFixture(c, round, {
          id: `${id}-${g}-${md + 1}-${i}`,
          teams: [a, b],
          label: `${label} · Group ${g} · Matchday ${md + 1}`,
          group: g, matchday: md + 1,
        }));
      });
    });
  }
  return round;
}

function tieRound(c, id, label, roundIndex, pairs, legs) {
  const round = { id, label, kind: 'ties', roundIndex, ties: [], fixtures: [], eliminated: [], leg: 'qualifying', totalRounds: meta.knockoutRounds };
  pairs.forEach(([a, b], i) => {
    const tie = { id: `${id}-${i}`, teams: [a, b], legs, label, winner: null };
    round.ties.push(tie);
    for (let leg = 1; leg <= legs; leg++) {
      round.fixtures.push(makeFixture(c, round, {
        id: `${id}-${i}-l${leg}`,
        teams: leg === 1 ? [a, b] : [b, a],
        label: legs === 2 ? `${label} · Leg ${leg}` : label,
        tieId: tie.id, leg, matchday: leg, index: i,
      }));
    }
  });
  return round;
}

function potsFrom(codes, count) {
  const ordered = codes.slice().sort((a, b) => seedOf(a) - seedOf(b));
  const per = ordered.length / count;
  const pots = [];
  for (let i = 0; i < count; i++) pots.push(ordered.slice(i * per, (i + 1) * per));
  return pots;
}

// --- start ------------------------------------------------------------------

export function start(c, rng) {
  c.meta.qualified = [];
  c.meta.playoffRep = null;
  c.meta.outcome = {};

  const lower = SEEDS.slice(26);                      // seeds 27-46
  const potA = lower.slice(0, 10), potB = lower.slice(10);
  const shuffled = rng.shuffle(potB);
  const pairs = potA.map((a, i) => [a, shuffled[i]]);
  c.meta.r1Pairs = pairs;

  const round = tieRound(c, 'r1', LABEL.r1, 0, pairs, 2);
  round.note = 'Twenty nations, ten two-legged ties. Ten survivors join the 26 seeded nations in the second round.';
  c.rounds.push(round);
  c.current = 0;
  return round;
}

// --- advance ----------------------------------------------------------------

function closeTies(c, round) {
  for (const tie of round.ties) {
    const legs = round.fixtures.filter(f => f.tieId === tie.id);
    if (!legs.every(f => f.result)) continue;
    const last = legs[legs.length - 1];
    const agg = aggregate({ teams: tie.teams, fixtures: legs });
    tie.aggregate = agg;
    let w;
    if (last.result.winner != null && tie.legs === 2) {
      // The second leg was simulated with the aggregate carried in, so its
      // winner is the tie winner (including after extra time and penalties).
      w = last.teams[last.result.winner];
    } else {
      w = agg[0] === agg[1] ? tie.teams[last.result.winner] : (agg[0] > agg[1] ? tie.teams[0] : tie.teams[1]);
    }
    tie.winner = w;
    tie.loser = tie.teams[0] === w ? tie.teams[1] : tie.teams[0];
    tie.summary = tie.legs === 2
      ? `${agg[0]}-${agg[1]} on aggregate${last.result.pens ? ` (${last.result.pens[0]}-${last.result.pens[1]} pens)` : ''}`
      : `${last.result.score[0]}-${last.result.score[1]}`;
    if (!round.eliminated.includes(tie.loser)) round.eliminated.push(tie.loser);
  }
}

function tablesFor(c, round) {
  const out = {};
  for (const g of Object.keys(round.groups)) {
    out[g] = rankTeams(round.groups[g], round.fixtures.filter(f => f.group === g),
      meta.groupTiebreakers, makeRng(seedFor(c.seed, 'table', round.id, g)), meta.points);
  }
  return out;
}

// Mark everyone knocked out of a round, so a followed nation always has a
// plain-language outcome no matter how early it went out.
function markOut(c, codes) {
  for (const code of codes) if (!c.meta.outcome[code]) c.meta.outcome[code] = 'out';
}

export function advance(c, rng) {
  const round = c.rounds[c.current];
  markOut(c, round.eliminated || []);

  if (round.id === 'r1') {
    closeTies(c, round);
    markOut(c, round.eliminated);
    const winners = round.ties.map(t => t.winner);
    c.meta.r1Winners = winners;
    const field = SEEDS.slice(0, 26).concat(winners);
    const { groups } = drawPotsSimple(potsFrom(field, 4), R2_GROUPS, rng);
    c.meta.r2Groups = groups;
    const r = groupRound(c, 'r2', LABEL.r2, 1, groups, 2);
    r.note = 'Nine groups of four, home and away. Group winners and runners-up go through — and also secure a place at the 2027 Asian Cup.';
    return r;
  }

  if (round.id === 'r2') {
    const tables = tablesFor(c, round);
    c.meta.r2Tables = tables;
    const through = [], out = [];
    for (const g of R2_GROUPS) {
      through.push(tables[g][0].code, tables[g][1].code);
      out.push(tables[g][2].code, tables[g][3].code);
    }
    round.eliminated = out;
    markOut(c, out);
    const { groups } = drawPotsSimple(potsFrom(through, 6), R3_GROUPS, rng);
    c.meta.r3Groups = groups;
    const r = groupRound(c, 'r3', LABEL.r3, 2, groups, 2);
    r.note = 'Three groups of six, home and away. The top two in each group qualify for the World Cup outright. Third and fourth drop into the fourth round.';
    return r;
  }

  if (round.id === 'r3') {
    const tables = tablesFor(c, round);
    c.meta.r3Tables = tables;
    const qualified = [], toR4 = [], out = [];
    for (const g of R3_GROUPS) {
      qualified.push(tables[g][0].code, tables[g][1].code);
      toR4.push(tables[g][2].code, tables[g][3].code);
      out.push(tables[g][4].code, tables[g][5].code);
    }
    c.meta.qualified.push(...qualified);
    for (const code of qualified) c.meta.outcome[code] = 'qualified';
    for (const code of out) c.meta.outcome[code] = 'out';
    round.eliminated = out;
    round.qualified = qualified;

    const { groups } = drawPotsSimple(potsFrom(toR4, 3), R4_GROUPS, rng);
    c.meta.r4Groups = groups;
    const r = groupRound(c, 'r4', LABEL.r4, 3, groups, 1);
    r.note = 'Six nations, two groups of three at a centralised venue, single matches. Each group winner takes the last two direct places.';
    return r;
  }

  if (round.id === 'r4') {
    const tables = tablesFor(c, round);
    c.meta.r4Tables = tables;
    const qualified = [], toR5 = [], out = [];
    for (const g of R4_GROUPS) {
      qualified.push(tables[g][0].code);
      toR5.push(tables[g][1].code);
      out.push(tables[g][2].code);
    }
    c.meta.qualified.push(...qualified);
    for (const code of qualified) c.meta.outcome[code] = 'qualified';
    for (const code of out) c.meta.outcome[code] = 'out';
    round.eliminated = out;
    round.qualified = qualified;

    const r = tieRound(c, 'r5', LABEL.r5, 4, [[toR5[0], toR5[1]]], 2);
    r.note = 'One two-legged tie. The winner does NOT qualify — it wins the right to play the inter-confederation play-off for Asia’s ninth place.';
    return r;
  }

  if (round.id === 'r5') {
    closeTies(c, round);
    const tie = round.ties[0];
    c.meta.playoffRep = tie.winner;
    c.meta.outcome[tie.winner] = 'playoff';
    c.meta.outcome[tie.loser] = 'out';
    c.champion = null;             // nobody "wins" a qualifying competition
    return null;
  }
  return null;
}

export function nextRoundLabel(id) {
  return { r1: 'the second round', r2: 'the third round', r3: 'the fourth round', r4: 'the fifth round' }[id] || 'the next round';
}

// Plain-language outcome for a nation at the end of a campaign.
export function outcomeText(c, code) {
  const o = c.meta.outcome[code];
  if (o === 'qualified') return 'Qualified for the 2026 World Cup.';
  if (o === 'playoff') return 'Reached the inter-confederation play-off. Not qualified — one more tournament stands in the way, and it is outside this ruleset.';
  return 'Did not qualify.';
}

export const AFC = { SEEDS, R2_GROUPS, R3_GROUPS, R4_GROUPS, LABEL };

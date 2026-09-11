// Road to Glory -- Asian qualification, the inter-confederation play-off, and
// the World Cup finals, as one continuous campaign.
//
// Ruleset version 2026.1. This module composes two verified rulesets rather than
// re-implementing either: the Asian rounds run under AFC rules (head-to-head
// before goal difference), the finals under FIFA rules (goal difference before
// head-to-head), and each round carries its own tiebreaker chain so both are
// correct in the same save file.
//
// The whole point of the mode is that the World Cup you play is the one YOUR
// qualifiers produced. The eight Asian nations that come through the fifth round
// take the eight Asian places in the finals field, and the ninth Asian place is
// won or lost in the play-off tournament, exactly as it is in real life.

import * as afc from './afcq2026.js';
import * as wc from './wc2026.js';
import { makeFixture } from '../../engine/campaign.js';
import { aggregate } from '../../engine/standings.js';
import { team } from '../teams.js';

// The published FIFA Play-off Tournament: six teams, two pathways, two places.
// The two highest-ranked entrants went straight to their pathway final; the
// other four played single-leg semi-finals.
//
// Pathway 1 is entirely outside the AFC and is reproduced as published.
// Pathway 2 is the one Asia's representative enters.
const PATH1 = { seed: 'COD', semi: ['NCL', 'JAM'] };
const PATH2 = { semiOthers: ['BOL', 'SUR'] };

export const meta = {
  id: 'rtg2026',
  name: 'Road to Glory',
  shortName: 'Road to Glory',
  edition: 2026,
  category: 'Senior men’s international',
  rulesetVersion: '2026.1',
  status: 'playable',
  blurb: 'Start in the Asian first round. Survive five rounds, the play-off if it comes to that, and then the World Cup itself. One campaign, one nation, all the way.',
  entrantsNote: 'All 46 AFC entrants. Qualify and you take your place in the finals — the eight Asian nations at the World Cup are the eight you produced, not the ones who qualified in real life.',
  teams: 46,
  knockoutRounds: 5,
  points: { win: 3, draw: 1, loss: 0 },
  // Default chain; every round overrides it with its own leg's rulebook.
  groupTiebreakers: afc.meta.groupTiebreakers,
  thirdTiebreakers: wc.meta.thirdTiebreakers,
  knockout: { extraTime: true, penalties: true, legs: 2 },
  legs: [
    { id: 'qualifying', label: 'Asian Qualification', ruleset: 'AFC 2026.1' },
    { id: 'playoff', label: 'Play-off Tournament', ruleset: 'FIFA 2026.1' },
    { id: 'finals', label: 'World Cup Finals', ruleset: 'FIFA 2026.1' },
  ],
  sources: [
    ...afc.meta.sources,
    { label: 'FIFA — Play-Off Tournament: teams, format and dates', url: 'https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/play-off-tournament-teams-qualifying-dates-tickets-matches-format' },
    ...wc.meta.sources,
  ],
  flags: [
    ...afc.meta.flags.filter(f => f.id !== 'playoff-scope'),
    { id: 'playoff-seeding', level: 'partly-verified',
      text: 'The play-off tournament’s published shape is kept exactly: six teams, two pathways, the two highest-ranked entrants seeded straight to their pathway finals. Asia’s representative inherits the seeded slot in pathway two. In reality that seeding followed the FIFA ranking of the actual entrants, so a lower-ranked Asian qualifier would have played the semi-final instead.' },
    { id: 'field-substitution', level: 'derived',
      text: 'Your eight Asian qualifiers take the eight pot slots the Asian teams occupied in the published draw pots, best AFC seed into the best available slot; the two play-off winners take the two play-off slots. Pot sizes are unchanged. Real pots follow the FIFA ranking, which a different set of qualifiers would change.' },
    ...wc.meta.flags,
  ],
};

export function eligible() { return afc.eligible(); }
export function entryStage(code) { return afc.entryStage(code); }
export function entryStageLabel(code) { return afc.entryStageLabel(code); }
export { seedOf } from './afcq2026.js';

// --- start: the Asian first round -------------------------------------------

export function start(c, rng) {
  c.meta.leg = 'qualifying';
  return afc.start(c, rng);
}

// --- the play-off tournament -------------------------------------------------

function playoffRound(c, rep) {
  const round = {
    id: 'icpo', label: 'Play-off Tournament', kind: 'ties', roundIndex: 4,
    ties: [], fixtures: [], eliminated: [], leg: 'playoff', totalRounds: 5,
    note: 'Six nations, two pathways, two places at the World Cup. The two highest-ranked entrants go straight to their pathway finals; the other four play single-leg semi-finals. Winning your pathway is qualification. Losing it is the end of the road.',
  };
  const add = (id, a, b, label, matchday) => {
    const tie = { id, teams: [a, b], legs: 1, label, winner: null };
    round.ties.push(tie);
    round.fixtures.push(makeFixture(c, round, {
      id: 'f-' + id, teams: [a, b], label, tieId: id, leg: 1, matchday,
    }));
  };
  add('p1s', PATH1.semi[0], PATH1.semi[1], 'Pathway 1 · Semi-final', 1);
  add('p2s', PATH2.semiOthers[0], PATH2.semiOthers[1], 'Pathway 2 · Semi-final', 1);
  round.pendingFinals = { rep };
  return round;
}

function playoffFinals(c, round) {
  // The two semi-final winners meet the seeded teams in their pathway finals.
  const w1 = round.ties.find(t => t.id === 'p1s').winner;
  const w2 = round.ties.find(t => t.id === 'p2s').winner;
  const rep = c.meta.playoffRep;
  const add = (id, a, b, label) => {
    const tie = { id, teams: [a, b], legs: 1, label, winner: null };
    round.ties.push(tie);
    round.fixtures.push(makeFixture(c, round, {
      id: 'f-' + id, teams: [a, b], label, tieId: id, leg: 1, matchday: 2,
    }));
  };
  add('p1f', PATH1.seed, w1, 'Pathway 1 · Final');
  add('p2f', rep, w2, 'Pathway 2 · Final');
}

// --- building the finals field ----------------------------------------------

// Slots in the published pots that were held by AFC teams or by play-off
// winners, in pot order. Everything else carries over unchanged.
const AFC_SLOTS = ['JPN', 'IRN', 'KOR', 'AUS', 'UZB', 'QAT', 'KSA', 'JOR'];
const PLAYOFF_SLOTS = ['COD', 'IRQ'];

export function buildFinalsPots(qualified, playoffWinners) {
  // Best AFC seed into the best available Asian slot.
  const ordered = qualified.slice().sort((a, b) => afc.seedOf(a) - afc.seedOf(b));
  const swap = new Map();
  AFC_SLOTS.forEach((slot, i) => swap.set(slot, ordered[i]));
  PLAYOFF_SLOTS.forEach((slot, i) => swap.set(slot, playoffWinners[i]));
  return wc.POTS.map(pot => pot.map(code => swap.has(code) ? swap.get(code) : code));
}

// --- advance -----------------------------------------------------------------

export function advance(c, rng) {
  const round = c.rounds[c.current];

  // --- leg 1: Asian qualification -------------------------------------------
  if (round.leg === 'qualifying') {
    const next = afc.advance(c, rng);
    if (next) return next;
    // afc.advance returns null once the fifth round is done. In Road to Glory
    // that is not the end: the fifth-round winner has the play-off to play.
    c.meta.leg = 'playoff';
    return playoffRound(c, c.meta.playoffRep);
  }

  // --- leg 2: the play-off tournament ---------------------------------------
  if (round.leg === 'playoff') {
    for (const tie of round.ties) {
      if (tie.winner) continue;
      const f = round.fixtures.find(x => x.tieId === tie.id);
      if (!f || !f.result) continue;
      tie.winner = f.teams[f.result.winner];
      tie.loser = f.teams[1 - f.result.winner];
      tie.summary = summarise(f);
      if (!round.eliminated.includes(tie.loser)) round.eliminated.push(tie.loser);
      if (!c.meta.outcome[tie.loser]) c.meta.outcome[tie.loser] = 'out';
    }
    if (round.ties.length === 2) {
      // Semi-finals done. The pathway finals are the second wave of the SAME
      // round, so hand the round back unchanged: the campaign engine sees it is
      // already the current round and simply keeps playing it.
      playoffFinals(c, round);
      return round;
    }

    const winners = [round.ties.find(t => t.id === 'p1f').winner, round.ties.find(t => t.id === 'p2f').winner];
    c.meta.playoffWinners = winners;
    const rep = c.meta.playoffRep;

    // The eight direct qualifiers were settled in the third and fourth rounds;
    // the play-off decides only the ninth Asian place.
    const directEight = c.meta.qualified.slice(0, 8);
    if (winners.includes(rep)) {
      c.meta.qualified.push(rep);
      c.meta.outcome[rep] = 'qualified';
      c.meta.repQualified = true;
    } else {
      c.meta.outcome[rep] = 'out';
      c.meta.repQualified = false;
    }

    c.meta.leg = 'finals';
    c.meta.finalsField = buildFinalsPots(directEight, winners);
    c.meta.drawPending = true;
    return wc.start(c, rng.fork('wcdraw'), { pots: c.meta.finalsField, push: false });
  }

  // --- leg 3: the World Cup finals ------------------------------------------
  return wc.advance(c, rng);
}

function summarise(f) {
  const [a, b] = f.result.score;
  let s = `${a}-${b}`;
  if (f.result.decidedBy === 'aet') s += ' (aet)';
  if (f.result.pens) s += ` (${f.result.pens[0]}-${f.result.pens[1]} pens)`;
  return s;
}

export function nextRoundLabel(id) {
  if (id === 'r5') return 'the play-off tournament';
  if (id === 'icpo') return 'the World Cup';
  return afc.nextRoundLabel(id) !== 'the next round' ? afc.nextRoundLabel(id) : wc.nextRoundLabel(id);
}

export function consequence(c, fixture, code, round) {
  if (round.leg === 'finals') return wc.consequence(c, fixture, code, round);
  if (round.leg !== 'playoff' || !fixture.result) return null;
  const won = fixture.teams[fixture.result.winner] === code;
  const how = fixture.result.decidedBy === 'pens' ? ' on penalties'
    : fixture.result.decidedBy === 'aet' ? ' after extra time' : '';
  if (fixture.label.endsWith('Semi-final')) {
    return won ? `Into the pathway final${how}. One match from the World Cup.` : `Eliminated${how}. The road ends here.`;
  }
  return won ? `QUALIFIED for the World Cup${how}.` : `Beaten in the pathway final${how}. The road ends one match short.`;
}

// Plain-language outcome for a nation at the end of the qualifying legs.
export function outcomeText(c, code) {
  const o = c.meta.outcome[code];
  if (o === 'qualified') return 'Qualified for the 2026 World Cup.';
  if (o === 'playoff') return 'In the inter-confederation play-off.';
  return 'Did not qualify.';
}

export const LEGS = { PATH1, PATH2, AFC_SLOTS, PLAYOFF_SLOTS };

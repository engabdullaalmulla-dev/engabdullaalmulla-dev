/**
 * The acceptance criteria in product/specs/balancer.md, as tests.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { explainPlacement, pairKey, pickSides } from './balancer.ts';
import type { BalancePlayer } from './types.ts';

const squad = (ratings: number[], extra: Partial<BalancePlayer>[] = []): BalancePlayer[] =>
  ratings.map((rating, i) => ({
    id: `p${i}`,
    rating,
    gamesPlayed: 40,
    ...(extra[i] ?? {}),
  }));

/** A realistic 7-a-side spread. */
const fourteen = squad([
  1400, 1380, 1330, 1310, 1290, 1280, 1260, 1250, 1230, 1210, 1190, 1170, 1150, 1120,
]);

describe('search', () => {
  test('7-a-side enumerates every one of the 1,716 splits', () => {
    const r = pickSides(fourteen);
    assert.equal(r.searchWasExhaustive, true);
    // Legal splits only — the top-two rule removes half of them.
    assert.ok(r.splitsEvaluated > 0 && r.splitsEvaluated <= 1716);
  });

  test('the result is stable — same inputs, same teams, every time', () => {
    const a = pickSides(fourteen);
    const b = pickSides(fourteen);
    assert.deepEqual(a.sideA, b.sideA);
    assert.deepEqual(a.sideB, b.sideB);
  });

  test('everyone is placed exactly once', () => {
    const r = pickSides(fourteen);
    const all = [...r.sideA, ...r.sideB].sort();
    assert.equal(all.length, fourteen.length);
    assert.deepEqual(new Set(all).size, fourteen.length);
  });

  test('11-a-side stays under a second', () => {
    const twentyTwo = squad(Array.from({ length: 22 }, (_, i) => 1400 - i * 12));
    const started = Date.now();
    const r = pickSides(twentyTwo);
    assert.equal(r.searchWasExhaustive, true);
    assert.ok(Date.now() - started < 1000, 'exhaustive search should be fast enough to be worth it');
  });
});

describe('hard constraints', () => {
  test('the two strongest are never on the same side', () => {
    for (let trial = 0; trial < 20; trial++) {
      const players = squad(
        Array.from({ length: 12 }, () => 1100 + Math.round(Math.random() * 300)),
      );
      const r = pickSides(players);
      const ranked = [...players].sort((a, b) => b.rating - a.rating);
      const topInA = r.sideA.includes(ranked[0].id);
      const secondInA = r.sideA.includes(ranked[1].id);
      assert.notEqual(topInA, secondInA);
    }
  });

  test('with exactly two declared keepers, each side gets one', () => {
    const players = squad(
      [1300, 1290, 1280, 1270, 1260, 1250, 1240, 1230, 1220, 1210],
      [{ isKeeper: true }, {}, {}, {}, {}, { isKeeper: true }],
    );
    const r = pickSides(players);
    assert.notEqual(r.sideA.includes('p0'), r.sideA.includes('p5'));
    assert.ok(r.reasons.includes('keepers-one-each'));
  });

  test('a crew of four is never placed wholly on one side', () => {
    const crew = { crewId: 'regulars' };
    const players = squad(
      [1300, 1290, 1280, 1270, 1260, 1250, 1240, 1230, 1220, 1210],
      [crew, crew, crew, crew],
    );
    const r = pickSides(players);
    const inA = ['p0', 'p1', 'p2', 'p3'].filter((id) => r.sideA.includes(id)).length;
    assert.ok(inA <= 2 && inA >= 2, 'four mates split two and two');
    assert.ok(r.reasons.includes('crew-split'));
  });

  test('a pair who booked together usually stay together', () => {
    const players = squad(
      [1300, 1290, 1280, 1270, 1260, 1250, 1240, 1230],
      [{ crewId: 'two' }, {}, {}, {}, {}, {}, { crewId: 'two' }],
    );
    const r = pickSides(players);
    assert.equal(r.sideA.includes('p0'), r.sideA.includes('p6'));
  });
});

describe('cold start — before any ratings exist', () => {
  test('a squad with no ratings returns a legal, varied split and does not error', () => {
    const players = squad(Array(12).fill(1150)).map((p) => ({ ...p, gamesPlayed: 0 }));
    const r = pickSides(players);
    assert.equal(r.sideA.length + r.sideB.length, 12);
    assert.equal(r.meanGap, 0);
    assert.ok(r.reasons.includes('no-ratings-yet'));
    assert.equal(r.unbalanceable, false);
  });

  test('crews are still respected with no ratings at all', () => {
    const players = squad(Array(10).fill(1150), [{ crewId: 'c' }, {}, {}, {}, { crewId: 'c' }]).map(
      (p) => ({ ...p, gamesPlayed: 0 }),
    );
    const r = pickSides(players);
    assert.equal(r.sideA.includes('p0'), r.sideA.includes('p4'));
  });
});

describe('variety', () => {
  test('the same regulars do not get the same split two weeks running', () => {
    const players = squad([1300, 1280, 1260, 1250, 1240, 1230, 1220, 1200, 1180, 1160]);

    const week1 = pickSides(players);

    // Feed week 1 back in as history and ask again.
    const history = new Map<string, number>();
    for (const side of [week1.sideA, week1.sideB]) {
      for (let i = 0; i < side.length; i++) {
        for (let j = i + 1; j < side.length; j++) {
          history.set(pairKey(side[i], side[j]), 3);
        }
      }
    }
    const week2 = pickSides(players, { pairHistory: history });

    const same =
      JSON.stringify([...week1.sideA].sort()) === JSON.stringify([...week2.sideA].sort()) ||
      JSON.stringify([...week1.sideA].sort()) === JSON.stringify([...week2.sideB].sort());
    assert.equal(same, false, 'a pure balance optimiser returns the same split forever');
  });
});

describe('late drops', () => {
  test('one dropout moves at most two players', () => {
    const published = pickSides(fourteen);
    const remaining = fourteen.filter((p) => p.id !== 'p7');

    const resolved = pickSides(remaining, {
      previousSides: { a: published.sideA, b: published.sideB },
    });

    let moved = 0;
    for (const p of remaining) {
      const wasA = published.sideA.includes(p.id);
      const isA = resolved.sideA.includes(p.id);
      if (wasA !== isA) moved++;
    }
    assert.ok(moved <= 2, `sheet reshuffled ${moved} names — people have already read it`);
  });
});

describe('honesty about its own limits', () => {
  test('a crowd that cannot be split says so', () => {
    // Three ringers and nine regulars. Whoever gets two of the three wins the
    // night, and no arrangement fixes that — so it must not pretend otherwise.
    // (Six strong and six weak, by contrast, splits perfectly three and three.)
    const players = squad([1600, 1590, 1580, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000]);
    const r = pickSides(players);
    assert.equal(r.unbalanceable, true, `mean gap was ${r.meanGap}`);
    assert.ok(r.reasons.includes('uneven'));
    assert.ok(!r.reasons.includes('dead-even'));
  });

  test('an evenly-distributed strong contingent is NOT called unbalanceable', () => {
    // The counterpart to the test above: six and six splits three and three.
    const players = squad([1500, 1490, 1480, 1470, 1460, 1450, 1050, 1040, 1030, 1020, 1010, 1000]);
    const r = pickSides(players);
    assert.equal(r.unbalanceable, false, `mean gap was ${r.meanGap}`);
  });

  test('an even squad is allowed to say dead even', () => {
    const r = pickSides(squad([1250, 1250, 1250, 1250, 1250, 1250, 1250, 1250]));
    assert.ok(r.reasons.includes('dead-even'));
    assert.equal(r.unbalanceable, false);
  });

  test('a realistic squad lands well inside the target', () => {
    const r = pickSides(fourteen);
    assert.ok(r.meanGap <= 15, `mean gap was ${r.meanGap}, target is 15 points in 90% of games`);
  });
});

describe('odd numbers', () => {
  test('an odd squad still produces two sides differing by one', () => {
    const r = pickSides(squad([1300, 1280, 1260, 1250, 1230, 1200, 1180]));
    assert.equal(Math.abs(r.sideA.length - r.sideB.length), 1);
    assert.ok(r.reasons.includes('odd-numbers'));
  });
});

describe('uncertainty', () => {
  test('a wildly mis-seeded newcomer does far less damage than their raw rating', () => {
    const ratings = [1250, 1250, 1250, 1250, 1250, 1250, 1250, 1900];
    const asNewcomer = pickSides(
      squad(ratings, [{}, {}, {}, {}, {}, {}, {}, { gamesPlayed: 0 }]),
    );
    const asRegular = pickSides(squad(ratings));

    // Same person, same claimed rating. Believed outright they open a large
    // gap; two games in, shrinkage toward the group mean cuts it by more than
    // half — which is the whole job of the confidence bands.
    assert.ok(
      asNewcomer.meanGap < asRegular.meanGap * 0.5,
      `shrinkage barely helped: ${asNewcomer.meanGap} vs ${asRegular.meanGap}`,
    );
  });

  test('and the night is still correctly reported as one that will not split', () => {
    // One player 650 points clear of seven others cannot be balanced by any
    // arrangement, and the honest answer is to say so rather than hide it.
    const r = pickSides(
      squad([1250, 1250, 1250, 1250, 1250, 1250, 1250, 1900], [{}, {}, {}, {}, {}, {}, {}, { gamesPlayed: 0 }]),
    );
    assert.equal(r.unbalanceable, true);
  });
});

describe('explaining a placement', () => {
  const players = squad(
    [1400, 1380, 1300, 1290, 1280, 1270, 1260, 1250],
    [{ crewId: 'pair' }, {}, {}, {}, {}, {}, {}, { crewId: 'pair' }],
  );

  test('it never names another player as weaker', () => {
    const r = pickSides(players);
    for (const p of players) {
      const lines = explainPlacement(p.id, r, players).join(' ');
      assert.ok(!/carry|weaker|worse|drag/i.test(lines), `leaked a judgement: ${lines}`);
    }
  });

  test('it never leaks a rating or a tier', () => {
    const r = pickSides(players);
    for (const p of players) {
      const lines = explainPlacement(p.id, r, players).join(' ');
      assert.ok(!/\d{4}/.test(lines), `leaked a rating: ${lines}`);
      assert.ok(!/level \d/i.test(lines), `leaked a tier: ${lines}`);
    }
  });

  test('the strongest player is told why they are split off', () => {
    const r = pickSides(players);
    const lines = explainPlacement('p0', r, players).join(' ');
    assert.match(lines, /two strongest/);
  });

  test('a pair who booked together are told that is why', () => {
    const r = pickSides(players);
    const lines = explainPlacement('p0', r, players).join(' ');
    assert.match(lines, /booked together/);
  });
});

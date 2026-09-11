/**
 * The worked examples in product/specs/ranking.md, as tests.
 *
 * If a number here changes, the spec is wrong or the engine is — one of them
 * has to move. That is the point: the document and the code cannot drift
 * quietly apart.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  applyDelta,
  computeDeltas,
  expectedScore,
  kFor,
  marginMultiplier,
  progressInTier,
  shouldDemote,
  tierOf,
} from './rating.ts';
import type { GameInput, RatedPlayer } from './types.ts';

const near = (actual: number, expected: number, tolerance = 0.05, message?: string) =>
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    message ?? `expected ${actual} to be within ${tolerance} of ${expected}`,
  );

/** The spec's Thursday game: your side averages 1250, theirs 1290. */
function thursday(overrides: Partial<GameInput> = {}): GameInput {
  // Side A means 1250 exactly; you are 1284, the second strongest.
  const sideA: RatedPlayer[] = [
    { id: 'you', rating: 1284, gamesPlayed: 30 },
    { id: 'weak', rating: 1150, gamesPlayed: 30 },
    { id: 'strong', rating: 1400, gamesPlayed: 30 },
    { id: 'filler', rating: 1166, gamesPlayed: 30 },
  ];
  const sideB: RatedPlayer[] = [{ id: 'opp', rating: 1290, gamesPlayed: 30 }];
  return {
    sideA,
    sideB,
    score: { a: 6, b: 5 },
    scoreConfirmedByHost: true,
    ...overrides,
  };
}

const find = (deltas: ReturnType<typeof computeDeltas>, id: string) => {
  const d = deltas.find((x) => x.playerId === id);
  assert.ok(d, `no delta for ${id}`);
  return d;
};

describe('tiers', () => {
  test('each tier is 100 points wide from 1000', () => {
    assert.equal(tierOf(999), 1);
    assert.equal(tierOf(1000), 2);
    assert.equal(tierOf(1284), 4);
    assert.equal(tierOf(1400), 6);
    assert.equal(tierOf(1500), 7);
    assert.equal(tierOf(9999), 7, 'tier 7 is open-ended');
  });

  test('1284 is 84% of the way through tier 4', () => {
    near(progressInTier(1284), 0.84, 0.001);
    near(progressInTier(1294), 0.94, 0.001);
  });
});

describe('K', () => {
  test('converges fast, then settles', () => {
    assert.equal(kFor(1), 60);
    assert.equal(kFor(5), 60);
    assert.equal(kFor(6), 32);
    assert.equal(kFor(20), 32);
    assert.equal(kFor(21), 16);
  });
});

describe('margin of victory', () => {
  test('a one-goal win gets nothing, five goals gets the full 15%', () => {
    near(marginMultiplier(1, true), 1.0, 0.001);
    near(marginMultiplier(2, true), 1.0375, 0.001);
    near(marginMultiplier(5, true), 1.15, 0.001);
  });

  test('past five goals it stops counting — nothing to gain from running it up', () => {
    assert.equal(marginMultiplier(5, true), marginMultiplier(9, true));
  });

  test('an unconfirmed score is indistinguishable from a one-goal result', () => {
    assert.equal(marginMultiplier(6, false), 1);
  });

  test('it is symmetric — a heavy defeat costs more', () => {
    assert.equal(marginMultiplier(-5, true), marginMultiplier(5, true));
  });
});

describe("the spec's worked example", () => {
  test('you are the underdog, and slightly favoured within your own side', () => {
    const d = find(computeDeltas(thursday()), 'you');
    near(d.expectedFromOwnRating, 0.491);
    near(d.expectedFromSide, 0.443);
    near(d.expected, 0.467);
  });

  test('a 6–5 win moves you +8.5, and votes take it to +9.8 → 1294', () => {
    const plain = find(computeDeltas(thursday()), 'you');
    near(plain.delta, 8.5);

    const voted = find(computeDeltas(thursday({ peerVotes: { you: 2 } })), 'you');
    near(voted.delta, 9.8);
    assert.equal(applyDelta(1284, voted.delta), 1294);
  });

  test('the same defeat costs −7.5, and a positive host read makes it −4.5', () => {
    const lost = thursday({ score: { a: 5, b: 6 } });
    near(find(computeDeltas(lost), 'you').delta, -7.5);

    const withRead = { ...lost, hostReads: { you: 'above' as const }, hostWeight: 1 };
    near(find(computeDeltas(withRead), 'you').delta, -4.5);
  });

  test('winning 6–1 instead adds the margin: +9.8, and +11.3 after votes', () => {
    const heavy = thursday({ score: { a: 6, b: 1 } });
    near(find(computeDeltas(heavy), 'you').delta, 9.8);
    near(find(computeDeltas({ ...heavy, peerVotes: { you: 2 } }), 'you').delta, 11.3);
  });

  test('a draw against a side you were expected to lose to is still a small gain', () => {
    const drawn = thursday({ score: { a: 5, b: 5 } });
    const d = find(computeDeltas(drawn), 'you');
    assert.ok(d.delta > 0, 'a draw as underdog should gain');
    near(d.delta, 0.5, 0.1);
  });
});

describe('input 1 — who you played against', () => {
  const opponentAt = (rating: number) =>
    find(computeDeltas(thursday({ sideB: [{ id: 'opp', rating, gamesPlayed: 30 }] })), 'you');

  test('beating a much stronger side moves you properly', () => {
    near(opponentAt(1400).delta, 11.0, 0.1);
  });

  test('beating a much weaker one barely moves you', () => {
    near(opponentAt(1100).delta, 4.4, 0.1);
  });

  test('the gain falls monotonically as the opposition weakens', () => {
    const strong = opponentAt(1400).delta;
    const even = opponentAt(1290).delta;
    const weak = opponentAt(1100).delta;
    assert.ok(strong > even && even > weak);
  });
});

describe('input 2 — where you already sit', () => {
  test('one result, three different moves on the same side', () => {
    const won = computeDeltas(thursday());
    near(find(won, 'weak').delta, 10.0, 0.1);
    near(find(won, 'you').delta, 8.5, 0.1);
    near(find(won, 'strong').delta, 7.2, 0.1);
  });

  test('and the losses reverse — more is expected of the better player', () => {
    const lost = computeDeltas(thursday({ score: { a: 5, b: 6 } }));
    near(find(lost, 'weak').delta, -6.0, 0.1);
    near(find(lost, 'you').delta, -7.5, 0.1);
    near(find(lost, 'strong').delta, -8.8, 0.1);
  });

  test('the strongest player in a side gains least and loses most', () => {
    const won = computeDeltas(thursday());
    assert.ok(find(won, 'strong').delta < find(won, 'weak').delta);

    const lost = computeDeltas(thursday({ score: { a: 5, b: 6 } }));
    assert.ok(find(lost, 'strong').delta < find(lost, 'weak').delta);
  });

  test('an under-rated player over-gains only until their expectation catches up', () => {
    // Convergence, not a leak: repeat the same win and the gain shrinks.
    let rating = 1150;
    let previousGain = Infinity;
    for (let i = 0; i < 8; i++) {
      const d = find(
        computeDeltas(
          thursday({
            sideA: [
              { id: 'weak', rating, gamesPlayed: 30 },
              { id: 'a', rating: 1250, gamesPlayed: 30 },
              { id: 'b', rating: 1250, gamesPlayed: 30 },
            ],
          }),
        ),
        'weak',
      );
      assert.ok(d.delta < previousGain, 'each identical win should be worth less than the last');
      previousGain = d.delta;
      rating = applyDelta(rating, d.delta);
    }
  });

  test('the reason codes name it', () => {
    const won = computeDeltas(thursday());
    assert.ok(find(won, 'strong').reasons.includes('more-expected-of-you'));
    assert.ok(find(won, 'weak').reasons.includes('less-expected-of-you'));
  });
});

describe('the three promises', () => {
  test('winning never moves you down — under any combination of modifiers', () => {
    for (const oppRating of [900, 1100, 1290, 1500, 1800]) {
      for (const read of ['above', 'level', 'below'] as const) {
        for (const votes of [-5, -2, 0, 2, 5]) {
          for (const games of [0, 3, 10, 30]) {
            const d = find(
              computeDeltas({
                sideA: [{ id: 'you', rating: 1284, gamesPlayed: games }],
                sideB: [{ id: 'opp', rating: oppRating, gamesPlayed: 30 }],
                score: { a: 6, b: 0 },
                scoreConfirmedByHost: true,
                hostReads: { you: read },
                hostWeight: 1,
                peerVotes: { you: votes },
              }),
              'you',
            );
            assert.ok(d.delta > 0, `won but moved ${d.delta} (opp ${oppRating}, ${read}, ${votes} votes)`);
          }
        }
      }
    }
  });

  test('losing always costs something — playing well only softens it', () => {
    const base: GameInput = {
      sideA: [{ id: 'you', rating: 1284, gamesPlayed: 30 }],
      sideB: [{ id: 'opp', rating: 1290, gamesPlayed: 30 }],
      score: { a: 0, b: 6 },
      scoreConfirmedByHost: true,
    };
    const plain = find(computeDeltas(base), 'you').delta;
    const praised = find(
      computeDeltas({ ...base, hostReads: { you: 'above' }, hostWeight: 1, peerVotes: { you: 2 } }),
      'you',
    ).delta;
    assert.ok(plain < 0 && praised < 0, 'a loss stays a loss');
    assert.ok(praised > plain, 'but it costs less');
  });

  test('your first games move you a lot', () => {
    const newcomer = find(
      computeDeltas({
        sideA: [{ id: 'new', rating: 1150, gamesPlayed: 0 }],
        sideB: [{ id: 'opp', rating: 1300, gamesPlayed: 30 }],
        score: { a: 6, b: 5 },
        scoreConfirmedByHost: true,
      }),
      'new',
    );
    assert.equal(newcomer.k, 60);
    assert.ok(newcomer.delta > 30, 'placement should move properly');
  });
});

describe('the layers fail safe', () => {
  test('no host read and no votes still produces a correct result-only change', () => {
    const d = find(computeDeltas(thursday()), 'you');
    assert.equal(d.modifier, 0);
    near(d.delta, 8.5);
  });

  test('host weight of zero degrades to the result alone, without errors or gaps', () => {
    const withRead = thursday({ hostReads: { you: 'below' }, hostWeight: 0 });
    const without = thursday();
    assert.equal(
      find(computeDeltas(withRead), 'you').delta,
      find(computeDeltas(without), 'you').delta,
    );
  });

  test('an uncalibrated host cannot outweigh the result', () => {
    const d = find(computeDeltas(thursday({ hostReads: { you: 'below' }, hostWeight: 0.2 })), 'you');
    assert.ok(d.delta > 0, 'a win with a poor read is still a win');
  });

  test('the host read counts for more during placement', () => {
    const game = (games: number) =>
      find(
        computeDeltas({
          sideA: [{ id: 'p', rating: 1200, gamesPlayed: games }],
          sideB: [{ id: 'o', rating: 1200, gamesPlayed: 30 }],
          score: { a: 3, b: 2 },
          scoreConfirmedByHost: true,
          hostReads: { p: 'above' },
          hostWeight: 1,
        }),
        'p',
      );
    const settled = game(30);
    const placing = game(1);
    assert.ok(placing.modifier > settled.modifier);
  });
});

describe('half-time rebalance', () => {
  test('a rebalanced game scores at half K', () => {
    const normal = find(computeDeltas(thursday()), 'you');
    const rebalanced = find(computeDeltas(thursday({ rebalancedAtHalfTime: true })), 'you');
    assert.equal(rebalanced.k, normal.k / 2);
    near(rebalanced.delta, normal.delta / 2, 0.01);
  });
});

describe('reproducibility', () => {
  test('same players, same result, same votes, same answer', () => {
    const a = computeDeltas(thursday({ peerVotes: { you: 1 }, hostReads: { weak: 'above' }, hostWeight: 0.7 }));
    const b = computeDeltas(thursday({ peerVotes: { you: 1 }, hostReads: { weak: 'above' }, hostWeight: 0.7 }));
    assert.deepEqual(a, b);
  });

  test('every rated player gets at least one reason', () => {
    for (const d of computeDeltas(thursday())) {
      assert.ok(d.reasons.length > 0, `${d.playerId} produced no reason — that is a bug`);
    }
  });
});

describe('demotion', () => {
  test('needs a sustained drop past the buffer', () => {
    assert.equal(shouldDemote(4, [1198, 1197, 1196]), false, 'a graze is not a demotion');
    assert.equal(shouldDemote(4, [1170, 1168, 1165]), true);
  });

  test('a player oscillating around the boundary is never demoted', () => {
    assert.equal(shouldDemote(4, [1205, 1195, 1202]), false);
  });
});

describe('guards', () => {
  test('an empty side is rejected rather than silently rated', () => {
    assert.throws(() =>
      computeDeltas({
        sideA: [],
        sideB: [{ id: 'o', rating: 1200, gamesPlayed: 3 }],
        score: { a: 0, b: 1 },
        scoreConfirmedByHost: false,
      }),
    );
  });

  test('expectation is symmetric around an even matchup', () => {
    near(expectedScore(1200, 1200), 0.5, 0.0001);
    near(expectedScore(1200, 1400) + expectedScore(1400, 1200), 1, 0.0001);
  });
});

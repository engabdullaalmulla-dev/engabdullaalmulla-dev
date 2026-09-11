/** Everything the server remembers about how people have been playing. */

import { db } from './db';
import type { LeaderboardRow, UserStats } from '../../shared/protocol';
import type { RoundResult } from '../../shared/types';

export interface RoundDelta {
  burns?: number;
  misfires?: number;
}

const EMPTY: UserStats = {
  matches: 0,
  wins: 0,
  rounds: 0,
  roundWins: 0,
  knocks: 0,
  knocksStuck: 0,
  burns: 0,
  misfires: 0,
  ashOuts: 0,
  bestRound: null,
  totalPoints: 0,
};

export function statsFor(userId: string): UserStats {
  const row = db().prepare('SELECT * FROM stats WHERE user_id = ?').get(userId) as
    | Record<string, number | null>
    | undefined;
  if (!row) return { ...EMPTY };
  return {
    matches: Number(row.matches ?? 0),
    wins: Number(row.wins ?? 0),
    rounds: Number(row.rounds ?? 0),
    roundWins: Number(row.round_wins ?? 0),
    knocks: Number(row.knocks ?? 0),
    knocksStuck: Number(row.knocks_stuck ?? 0),
    burns: Number(row.burns ?? 0),
    misfires: Number(row.misfires ?? 0),
    ashOuts: Number(row.ash_outs ?? 0),
    bestRound: row.best_round == null ? null : Number(row.best_round),
    totalPoints: Number(row.total_points ?? 0),
  };
}

function ensureRow(userId: string): void {
  db()
    .prepare('INSERT OR IGNORE INTO stats (user_id, updated_at) VALUES (?, ?)')
    .run(userId, Date.now());
}

/** Folds one finished round into every human seat's record. */
export function recordRound(
  userIds: string[],
  result: RoundResult,
  perPlayer: Record<string, RoundDelta> = {},
): void {
  const now = Date.now();
  const update = db().prepare(`
    UPDATE stats SET
      rounds       = rounds + 1,
      round_wins   = round_wins + ?,
      knocks       = knocks + ?,
      knocks_stuck = knocks_stuck + ?,
      ash_outs     = ash_outs + ?,
      burns        = burns + ?,
      misfires     = misfires + ?,
      total_points = total_points + ?,
      best_round   = CASE
                       WHEN best_round IS NULL OR best_round > ? THEN ?
                       ELSE best_round
                     END,
      updated_at   = ?
    WHERE user_id = ?
  `);

  const apply = db().transaction(() => {
    for (const userId of userIds) {
      ensureRow(userId);
      const delta = perPlayer[userId] ?? {};
      const pile = result.totals[userId] ?? 0;
      update.run(
        result.winnerId === userId ? 1 : 0,
        result.knockerId === userId ? 1 : 0,
        result.knockerId === userId && result.knockSucceeded ? 1 : 0,
        result.ashOutId === userId ? 1 : 0,
        delta.burns ?? 0,
        delta.misfires ?? 0,
        result.scored[userId] ?? 0,
        pile,
        pile,
        now,
        userId,
      );
    }
  });
  apply();
}

/** Folds a finished match in, and keeps a row of history per player. */
export function recordMatch(
  standings: Array<{ userId: string; score: number }>,
  winnerId: string | null,
  seats: number,
): void {
  const now = Date.now();
  const ordered = [...standings].sort((a, b) => a.score - b.score);
  const bump = db().prepare(
    'UPDATE stats SET matches = matches + 1, wins = wins + ?, updated_at = ? WHERE user_id = ?',
  );
  const history = db().prepare(
    'INSERT INTO match_history (user_id, finished_at, placement, score, seats) VALUES (?,?,?,?,?)',
  );

  const apply = db().transaction(() => {
    ordered.forEach((entry, index) => {
      ensureRow(entry.userId);
      bump.run(entry.userId === winnerId ? 1 : 0, now, entry.userId);
      history.run(entry.userId, now, index + 1, entry.score, seats);
    });
  });
  apply();
}

/** Ranked by win rate, with enough matches behind it to mean something. */
export function leaderboard(limit = 25, minMatches = 3): LeaderboardRow[] {
  const rows = db()
    .prepare(
      `SELECT users.name AS name, stats.matches AS matches, stats.wins AS wins,
              stats.best_round AS best_round
       FROM stats JOIN users ON users.id = stats.user_id
       WHERE stats.matches >= ?
       ORDER BY (CAST(stats.wins AS REAL) / stats.matches) DESC, stats.matches DESC
       LIMIT ?`,
    )
    .all(minMatches, limit) as Array<{
    name: string;
    matches: number;
    wins: number;
    best_round: number | null;
  }>;

  return rows.map((row) => ({
    name: row.name,
    matches: row.matches,
    wins: row.wins,
    winRate: row.matches ? row.wins / row.matches : 0,
    bestRound: row.best_round,
  }));
}

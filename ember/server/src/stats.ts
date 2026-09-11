/** Everything the server remembers about how people have been playing. */

import { db } from './db';
import type { Board, BoardScope, LeaderboardRow, RankState, UserStats } from '../../shared/protocol';
import { matchPoints, seasonEndsAt, seasonOf, tierFor } from '../../shared/progress';
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
  /**
   * Whether the match counts towards the season.
   *
   * A table of one person and four bots is a fine way to spend an evening and
   * a poor way to earn a rank, so only a table with somebody else real on it
   * pays out points.
   */
  ranked = false,
  now = Date.now(),
): void {
  const ordered = [...standings].sort((a, b) => a.score - b.score);
  const season = seasonOf(now);
  const bump = db().prepare(
    'UPDATE stats SET matches = matches + 1, wins = wins + ?, updated_at = ? WHERE user_id = ?',
  );
  const history = db().prepare(
    'INSERT INTO match_history (user_id, finished_at, placement, score, seats) VALUES (?,?,?,?,?)',
  );
  const seasonRow = db().prepare(`
    INSERT INTO season_stats (user_id, season, points, matches, wins) VALUES (?,?,?,1,?)
    ON CONFLICT(user_id, season) DO UPDATE SET
      points  = MAX(0, points + excluded.points),
      matches = matches + 1,
      wins    = wins + excluded.wins
  `);

  const apply = db().transaction(() => {
    ordered.forEach((entry, index) => {
      ensureRow(entry.userId);
      const won = entry.userId === winnerId ? 1 : 0;
      bump.run(won, now, entry.userId);
      history.run(entry.userId, now, index + 1, entry.score, seats);
      if (ranked) {
        const points = Math.max(0, matchPoints(index + 1, seats));
        seasonRow.run(entry.userId, season, points, won);
      }
    });
  });
  apply();
}

/* ------------------------------------------------------------------ */
/* ranks and boards                                                    */
/* ------------------------------------------------------------------ */

/** Where somebody stands this season, including their place on the board. */
export function rankFor(userId: string, now = Date.now()): RankState {
  const season = seasonOf(now);
  const row = db()
    .prepare('SELECT points, matches, wins FROM season_stats WHERE user_id = ? AND season = ?')
    .get(userId, season) as { points: number; matches: number; wins: number } | undefined;

  const points = Number(row?.points ?? 0);
  const place =
    points > 0
      ? (
          db()
            .prepare(
              'SELECT COUNT(*) AS ahead FROM season_stats WHERE season = ? AND points > ?',
            )
            .get(season, points) as { ahead: number }
        ).ahead + 1
      : null;

  return {
    season,
    endsAt: seasonEndsAt(now),
    points,
    tier: tierFor(points),
    matches: Number(row?.matches ?? 0),
    wins: Number(row?.wins ?? 0),
    place,
  };
}

interface RawRow {
  user_id: string;
  name: string;
  avatar: string;
  matches: number;
  wins: number;
  best_round: number | null;
  points: number;
}

function shape(row: RawRow): LeaderboardRow {
  const points = Number(row.points ?? 0);
  return {
    userId: row.user_id,
    name: row.name,
    avatar: row.avatar ?? '',
    matches: Number(row.matches ?? 0),
    wins: Number(row.wins ?? 0),
    winRate: row.matches ? Number(row.wins) / Number(row.matches) : 0,
    bestRound: row.best_round == null ? null : Number(row.best_round),
    points,
    tier: tierFor(points),
  };
}

const SEASON_BOARD = `
  SELECT users.id AS user_id, users.name AS name, users.avatar AS avatar,
         season_stats.matches AS matches, season_stats.wins AS wins,
         season_stats.points AS points, stats.best_round AS best_round
  FROM season_stats
  JOIN users ON users.id = season_stats.user_id
  LEFT JOIN stats ON stats.user_id = season_stats.user_id
  WHERE season_stats.season = ?`;

const ALL_TIME_BOARD = `
  SELECT users.id AS user_id, users.name AS name, users.avatar AS avatar,
         stats.matches AS matches, stats.wins AS wins,
         stats.best_round AS best_round, 0 AS points
  FROM stats
  JOIN users ON users.id = stats.user_id
  WHERE stats.matches >= ?`;

/**
 * One board, and your own row with it.
 *
 * The season board is ranked on points, which is what the rank ladder is
 * made of. The all-time board is ranked on win rate, with enough matches
 * behind it to mean something — one lucky win should not sit above a hundred
 * hard ones.
 */
export function board(
  scope: BoardScope,
  userId: string | null,
  limit = 50,
  minMatches = 3,
  now = Date.now(),
): Board {
  const season = seasonOf(now);
  const top =
    scope === 'season'
      ? (db()
          .prepare(`${SEASON_BOARD} ORDER BY points DESC, wins DESC, name ASC LIMIT ?`)
          .all(season, limit) as RawRow[])
      : (db()
          .prepare(
            `${ALL_TIME_BOARD} ORDER BY (CAST(wins AS REAL) / matches) DESC, matches DESC, name ASC LIMIT ?`,
          )
          .all(minMatches, limit) as RawRow[]);

  const rows = top.map(shape);
  let you: (LeaderboardRow & { place: number }) | null = null;

  if (userId) {
    const at = rows.findIndex((row) => row.userId === userId);
    if (at >= 0) {
      you = { ...rows[at], place: at + 1 };
    } else if (scope === 'season') {
      const mine = db().prepare(`${SEASON_BOARD} AND season_stats.user_id = ?`).get(season, userId) as
        | RawRow
        | undefined;
      if (mine) {
        const ahead = (
          db()
            .prepare('SELECT COUNT(*) AS ahead FROM season_stats WHERE season = ? AND points > ?')
            .get(season, mine.points) as { ahead: number }
        ).ahead;
        you = { ...shape(mine), place: ahead + 1 };
      }
    } else {
      const mine = db()
        .prepare(`${ALL_TIME_BOARD.replace('stats.matches >= ?', 'stats.user_id = ?')}`)
        .get(userId) as RawRow | undefined;
      if (mine && mine.matches >= minMatches) {
        const rate = mine.matches ? mine.wins / mine.matches : 0;
        const ahead = (
          db()
            .prepare(
              `SELECT COUNT(*) AS ahead FROM stats
               WHERE matches >= ? AND (CAST(wins AS REAL) / matches) > ?`,
            )
            .get(minMatches, rate) as { ahead: number }
        ).ahead;
        you = { ...shape(mine), place: ahead + 1 };
      }
    }
  }

  return { scope, season, endsAt: seasonEndsAt(now), rows, you };
}

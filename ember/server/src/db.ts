import fs from 'node:fs';
import path from 'node:path';

import Database from 'better-sqlite3';

import { config } from './config';

export type Db = Database.Database;

let instance: Db | null = null;

/**
 * One SQLite file, opened once. WAL so reads during a game never block on the
 * write that finished the last one.
 */
export function db(): Db {
  if (instance) return instance;
  const file = config.databasePath;
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
  instance = new Database(file);
  instance.pragma('journal_mode = WAL');
  instance.pragma('foreign_keys = ON');
  migrate(instance);
  return instance;
}

/** Used by the tests, which want a fresh database per run. */
export function useDatabase(handle: Db): Db {
  instance = handle;
  handle.pragma('foreign_keys = ON');
  migrate(handle);
  return handle;
}

export function migrate(handle: Db): void {
  handle.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            TEXT PRIMARY KEY,
      name          TEXT NOT NULL,
      name_folded   TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at    INTEGER NOT NULL,
      last_seen_at  INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id);

    CREATE TABLE IF NOT EXISTS stats (
      user_id      TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      matches      INTEGER NOT NULL DEFAULT 0,
      wins         INTEGER NOT NULL DEFAULT 0,
      rounds       INTEGER NOT NULL DEFAULT 0,
      round_wins   INTEGER NOT NULL DEFAULT 0,
      knocks       INTEGER NOT NULL DEFAULT 0,
      knocks_stuck INTEGER NOT NULL DEFAULT 0,
      burns        INTEGER NOT NULL DEFAULT 0,
      misfires     INTEGER NOT NULL DEFAULT 0,
      ash_outs     INTEGER NOT NULL DEFAULT 0,
      best_round   INTEGER,
      total_points INTEGER NOT NULL DEFAULT 0,
      updated_at   INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS season_stats (
      user_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      season    TEXT NOT NULL,
      points    INTEGER NOT NULL DEFAULT 0,
      matches   INTEGER NOT NULL DEFAULT 0,
      wins      INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (user_id, season)
    );
    CREATE INDEX IF NOT EXISTS season_board ON season_stats(season, points DESC);

    CREATE TABLE IF NOT EXISTS match_history (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      finished_at INTEGER NOT NULL,
      placement   INTEGER NOT NULL,
      score       INTEGER NOT NULL,
      seats       INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS history_user ON match_history(user_id, finished_at DESC);
  `);

  // Added after the first accounts existed, so it arrives as an alteration
  // rather than part of the table above.
  addColumn(handle, 'users', 'avatar', "TEXT NOT NULL DEFAULT ''");
}

/** Adds a column if this database has not got it yet. */
function addColumn(handle: Db, table: string, column: string, definition: string): void {
  const columns = handle.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  if (columns.some((entry) => entry.name === column)) return;
  handle.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}

/** Sessions expire on their own; this clears the rows they leave behind. */
export function sweepExpiredSessions(handle: Db = db(), now = Date.now()): number {
  return handle.prepare('DELETE FROM sessions WHERE expires_at < ?').run(now).changes;
}

/** Everything the server reads from its environment, in one place. */

function number(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

export const config = {
  port: number('PORT', 8787),
  /** Where the SQLite file lives. On Fly this should be on the mounted volume. */
  databasePath: process.env.DATABASE_PATH ?? './data/ember.db',
  /** Sessions last this long before a player has to sign in again. */
  sessionDays: number('SESSION_DAYS', 60),
  /** How long a player has to make a move online before the table moves on. */
  turnSeconds: number('TURN_SECONDS', 30),
  /** How long the burn window stays open. Lowered in tests. */
  burnWindowMs: number('BURN_WINDOW_MS', 3200),
  /** How long the scoring sheet stays up between rounds. */
  roundBreakSeconds: number('ROUND_BREAK_SECONDS', 8),
  /** A dropped player is held open this long before a bot takes the seat. */
  reconnectSeconds: number('RECONNECT_SECONDS', 45),
  /** Quick match waits this long for people before filling up with bots. */
  quickMatchWaitSeconds: number('QUICK_MATCH_WAIT_SECONDS', 20),
  /** Seats at a table, including bots. */
  maxSeats: number('MAX_SEATS', 5),
  /** Cap on rooms, so one machine cannot be filled up by anyone who asks. */
  maxRooms: number('MAX_ROOMS', 500),
  /** Trust X-Forwarded-For. Only turn this on behind a proxy you control. */
  trustProxy: process.env.TRUST_PROXY === '1',
  /** Allowed origins for browser clients. Empty means same-origin only. */
  corsOrigins: (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
} as const;

export type Config = typeof config;

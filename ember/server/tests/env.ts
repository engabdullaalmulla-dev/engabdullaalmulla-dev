/**
 * Loaded before anything else so the modules under test pick up a small,
 * fast configuration instead of the one real players would get.
 */
process.env.DATABASE_PATH = ':memory:';
process.env.TURN_SECONDS = process.env.TURN_SECONDS ?? '2';
process.env.BURN_WINDOW_MS = process.env.BURN_WINDOW_MS ?? '60';
process.env.ROUND_BREAK_SECONDS = process.env.ROUND_BREAK_SECONDS ?? '1';
process.env.QUICK_MATCH_WAIT_SECONDS = process.env.QUICK_MATCH_WAIT_SECONDS ?? '1';
export {};

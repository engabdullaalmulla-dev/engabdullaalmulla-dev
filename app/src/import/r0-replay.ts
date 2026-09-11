/**
 * Replay the R0 paper games through the rating engine.
 *
 * This is the payoff for the spreadsheet. Before the rating model goes
 * anywhere near a player, run every game recorded on paper through it and
 * look at what comes out: does it place people where the host would have
 * placed them? Does it converge in the number of games ranking.md claims?
 * Do the weights need moving before launch rather than after?
 *
 * Usage:
 *   node --experimental-strip-types src/import/r0-replay.ts games.csv appearances.csv
 *
 * The two CSVs are exports of tabs 1 and 3 of the R0 sheet. Column names are
 * matched case-insensitively and unknown columns are ignored, so the sheet can
 * grow without breaking this.
 */

import { readFileSync } from 'node:fs';

import { applyDelta, computeDeltas, progressInTier, tierOf } from '../engine/rating.ts';
import type { GameInput, HostRead, RatedPlayer } from '../engine/types.ts';

interface GameRow {
  game_id: string;
  date: string;
  score_a: number;
  score_b: number;
  score_confirmed: boolean;
  rebalanced: boolean;
}

interface AppearanceRow {
  game_id: string;
  player_id: string;
  side: 'A' | 'B';
  showed: boolean;
  host_read?: HostRead;
  peer_votes: number;
}

/** Minimal RFC-4180 reader — quoted fields, embedded commas and newlines. */
export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += c;
      continue;
    }
    if (c === '"') quoted = true;
    else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (c !== '\r') field += c;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  if (rows.length === 0) return [];

  const header = rows[0].map((h) => h.trim().toLowerCase());
  return rows
    .slice(1)
    .filter((r) => r.some((cell) => cell.trim() !== ''))
    .map((r) => Object.fromEntries(header.map((h, i) => [h, (r[i] ?? '').trim()])));
}

const truthy = (v: string | undefined) =>
  ['y', 'yes', 'true', '1', 'x'].includes((v ?? '').toLowerCase());

function readGames(path: string): GameRow[] {
  return parseCsv(readFileSync(path, 'utf8')).map((r) => ({
    game_id: r.game_id,
    date: r.date ?? '',
    score_a: Number(r.score_a ?? 0),
    score_b: Number(r.score_b ?? 0),
    // Absent column means the sheet did not track it: assume unconfirmed, so
    // margin does not silently apply to scores nobody actually verified.
    score_confirmed: truthy(r.score_confirmed ?? r.score_confirmed_by_host),
    rebalanced: truthy(r.rebalanced ?? r.rebalanced_at_half_time),
  }));
}

function readAppearances(path: string): AppearanceRow[] {
  return parseCsv(readFileSync(path, 'utf8'))
    .map((r) => ({
      game_id: r.game_id,
      player_id: r.player_id,
      side: (r.side ?? 'A').toUpperCase() as 'A' | 'B',
      // Record arrivals, not bookings. The gap between them is the no-show
      // rate; only the people who actually played get rated.
      showed: truthy(r.showed),
      host_read: ['above', 'level', 'below'].includes((r.host_read ?? '').toLowerCase())
        ? ((r.host_read ?? '').toLowerCase() as HostRead)
        : undefined,
      peer_votes: Number(r.motm ?? r.peer_votes ?? 0) || 0,
    }))
    .filter((a) => a.showed);
}

export interface ReplayOptions {
  /** Seed rating for a player's first appearance. */
  startingRating?: number;
  /**
   * How far to trust the R0 host's reads. They were taken on paper by one
   * person with no calibration history, so this is a judgement call, not a
   * measurement — start low and see whether raising it helps.
   */
  hostWeight?: number;
}

export interface ReplayResult {
  ratings: Map<string, { rating: number; games: number }>;
  gamesReplayed: number;
  playersSeen: number;
}

export function replay(
  games: GameRow[],
  appearances: AppearanceRow[],
  options: ReplayOptions = {},
): ReplayResult {
  const startingRating = options.startingRating ?? 1150;
  const hostWeight = options.hostWeight ?? 0.3;

  const state = new Map<string, { rating: number; games: number }>();
  const byGame = new Map<string, AppearanceRow[]>();
  for (const a of appearances) {
    const list = byGame.get(a.game_id) ?? [];
    list.push(a);
    byGame.set(a.game_id, list);
  }

  const ordered = [...games].sort((a, b) => a.date.localeCompare(b.date));
  let replayed = 0;

  for (const game of ordered) {
    const rows = byGame.get(game.game_id) ?? [];
    if (rows.length === 0) continue;

    const toRated = (r: AppearanceRow): RatedPlayer => {
      const s = state.get(r.player_id) ?? { rating: startingRating, games: 0 };
      state.set(r.player_id, s);
      return { id: r.player_id, rating: s.rating, gamesPlayed: s.games };
    };

    const sideA = rows.filter((r) => r.side === 'A').map(toRated);
    const sideB = rows.filter((r) => r.side === 'B').map(toRated);
    if (sideA.length === 0 || sideB.length === 0) continue;

    const input: GameInput = {
      sideA,
      sideB,
      score: { a: game.score_a, b: game.score_b },
      scoreConfirmedByHost: game.score_confirmed,
      hostWeight,
      rebalancedAtHalfTime: game.rebalanced,
      hostReads: Object.fromEntries(
        rows.filter((r) => r.host_read).map((r) => [r.player_id, r.host_read!]),
      ),
      peerVotes: Object.fromEntries(rows.map((r) => [r.player_id, r.peer_votes])),
    };

    for (const d of computeDeltas(input)) {
      const s = state.get(d.playerId)!;
      s.rating = applyDelta(s.rating, d.delta);
      s.games += 1;
    }
    replayed++;
  }

  return { ratings: state, gamesReplayed: replayed, playersSeen: state.size };
}

function main(): void {
  const [gamesPath, appearancesPath] = process.argv.slice(2);
  if (!gamesPath || !appearancesPath) {
    console.error('usage: r0-replay.ts <games.csv> <appearances.csv>');
    process.exit(1);
  }

  const result = replay(readGames(gamesPath), readAppearances(appearancesPath));

  const table = [...result.ratings.entries()]
    .sort((a, b) => b[1].rating - a[1].rating)
    .map(([id, s]) => ({
      player: id,
      games: s.games,
      rating: s.rating,
      tier: tierOf(s.rating),
      'through tier': `${Math.round(progressInTier(s.rating) * 100)}%`,
    }));

  console.log(`\n${result.gamesReplayed} games · ${result.playersSeen} players\n`);
  console.table(table);
  console.log(
    '\nSanity checks worth making by eye:\n' +
      '  - Does this ordering match what the host would have said?\n' +
      '  - Has anyone with 5+ games still not left their starting tier?\n' +
      '  - Is the spread wider than the real spread of ability in the group?\n' +
      '\nIf the answers are bad, move the weights in src/engine/weights.ts and\n' +
      'run this again. That is the entire reason the paper records exist.\n',
  );
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop() ?? '')) {
  main();
}

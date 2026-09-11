import './env';

import Database from 'better-sqlite3';

import { EXPRESSION_LIMIT } from '../../shared/expressions';
import {
  matchPoints,
  seasonEndsAt,
  seasonOf,
  standing,
  tierFor,
} from '../../shared/progress';
import type { ServerMessage } from '../../shared/protocol';
import type { GameAction } from '../../shared/types';
import type { TableView } from '../../shared/view';
import {
  AuthError,
  RateLimiter,
  foldName,
  hashPassword,
  login,
  register,
  revokeSession,
  userForToken,
  verifyPassword,
} from '../src/auth';
import { useDatabase } from '../src/db';
import { Hub } from '../src/hub';
import { Room, RoomError, type Connection } from '../src/room';
import { board, rankFor, recordMatch, recordRound, statsFor } from '../src/stats';

useDatabase(new Database(':memory:'));

let passed = 0;
const failures: string[] = [];
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function check(name: string, condition: boolean, detail = ''): void {
  if (condition) passed += 1;
  else failures.push(`${name}${detail ? ` — ${detail}` : ''}`);
}

function equal(name: string, actual: unknown, expected: unknown): void {
  check(name, Object.is(actual, expected), `expected ${String(expected)}, got ${String(actual)}`);
}

async function throws(name: string, run: () => Promise<unknown> | unknown, code?: string) {
  try {
    await run();
    failures.push(`${name} — expected it to be refused`);
  } catch (error) {
    const actual =
      error instanceof AuthError ? error.code : error instanceof RoomError ? error.code : 'unknown';
    if (code && actual !== code) failures.push(`${name} — refused with ${actual}, expected ${code}`);
    else passed += 1;
  }
}

async function main() {
  /* ---------------------------------------------------------------- */
  /* passwords                                                         */
  /* ---------------------------------------------------------------- */

  const hash = await hashPassword('correct horse battery');
  check('a hash does not contain the password', !hash.includes('correct horse battery'));
  check('a hash names its own parameters', hash.startsWith('scrypt$16384$8$1$'));
  check('the right password verifies', await verifyPassword('correct horse battery', hash));
  check('a wrong password does not', !(await verifyPassword('correct horse batteru', hash)));
  check('an empty password does not', !(await verifyPassword('', hash)));
  check('a tampered hash does not', !(await verifyPassword('correct horse battery', hash.slice(0, -4) + 'AAAA')));
  check('a nonsense hash is refused, not crashed on', !(await verifyPassword('x', 'nonsense')));

  const same = await hashPassword('correct horse battery');
  check('two hashes of one password differ (salted)', same !== hash);

  equal('names fold for comparison', foldName('  RaShiD '), 'rashid');

  /* ---------------------------------------------------------------- */
  /* accounts                                                          */
  /* ---------------------------------------------------------------- */

  const abdulla = await register('Abdulla', 'burning-ember-1');
  check('registering returns a token', abdulla.token.length > 20);
  equal('registering returns the name as typed', abdulla.user.name, 'Abdulla');

  await throws('the same name cannot be taken twice', () => register('Abdulla', 'another-password'), 'name_taken');
  await throws('nor a case variant of it', () => register('abdulla', 'another-password'), 'name_taken');
  await throws('short names are refused', () => register('ab', 'long-enough-password'), 'bad_name');
  await throws('odd characters are refused', () => register('rm -rf /', 'long-enough-password'), 'bad_name');
  await throws('short passwords are refused', () => register('Someone', 'short'), 'weak_password');
  await throws('absurd passwords are refused', () => register('Someone', 'x'.repeat(500)), 'long_password');

  const signedIn = await login('abdulla', 'burning-ember-1');
  equal('signing in is case-insensitive', signedIn.user.id, abdulla.user.id);
  await throws('a wrong password is refused', () => login('Abdulla', 'wrong'), 'bad_credentials');
  await throws('an unknown name is refused the same way', () => login('Nobody', 'wrong'), 'bad_credentials');

  equal('a token resolves to its owner', userForToken(abdulla.token)?.id, abdulla.user.id);
  equal('a made-up token resolves to nobody', userForToken('not-a-real-token'), null);
  equal('an empty token resolves to nobody', userForToken(''), null);
  revokeSession(signedIn.token);
  equal('a revoked token stops working', userForToken(signedIn.token), null);
  equal('and does not disturb the other session', userForToken(abdulla.token)?.id, abdulla.user.id);

  /* ---------------------------------------------------------------- */
  /* rate limiting                                                     */
  /* ---------------------------------------------------------------- */

  const limiter = new RateLimiter(3, 1000);
  equal('the first try is allowed', limiter.take('ip', 0), true);
  limiter.take('ip', 1);
  limiter.take('ip', 2);
  equal('the fourth try in the window is not', limiter.take('ip', 3), false);
  equal('a different caller is unaffected', limiter.take('other', 3), true);
  equal('the window slides', limiter.take('ip', 2000), true);

  /* ---------------------------------------------------------------- */
  /* stats                                                             */
  /* ---------------------------------------------------------------- */

  const noura = await register('Noura', 'burning-ember-2');
  const salem = await register('Salem', 'burning-ember-3');
  const seats = [abdulla.user.id, noura.user.id, salem.user.id];

  recordRound(
    seats,
    {
      totals: { [seats[0]]: 11, [seats[1]]: 18, [seats[2]]: 27 },
      scored: { [seats[0]]: 0, [seats[1]]: 18, [seats[2]]: 27 },
      knockerId: seats[0],
      knockSucceeded: true,
      ashOutId: null,
      winnerId: seats[0],
    },
    { [seats[0]]: { burns: 2, misfires: 1 } },
  );

  const mine = statsFor(seats[0]);
  equal('a round is counted', mine.rounds, 1);
  equal('winning it is counted', mine.roundWins, 1);
  equal('the knock is counted', mine.knocks, 1);
  equal('a knock that stuck is counted', mine.knocksStuck, 1);
  equal('burns are counted', mine.burns, 2);
  equal('misfires are counted', mine.misfires, 1);
  equal('the best pile is remembered', mine.bestRound, 11);
  equal('points are added up', mine.totalPoints, 0);
  equal("a rival's loss is theirs alone", statsFor(seats[1]).roundWins, 0);

  recordMatch(
    seats.map((id, index) => ({ userId: id, score: [12, 40, 60][index] })),
    seats[0],
    3,
    true,
  );
  equal('a match is counted', statsFor(seats[0]).matches, 1);
  equal('winning it is counted', statsFor(seats[0]).wins, 1);
  equal('losing it is counted too', statsFor(seats[1]).matches, 1);
  equal('but not as a win', statsFor(seats[1]).wins, 0);

  const allTime = board('allTime', null, 10, 1);
  equal('the all-time board ranks the winner first', allTime.rows[0]?.name, 'Abdulla');
  equal('and shows a win rate', allTime.rows[0]?.winRate, 1);
  check(
    'players below the match threshold are left out',
    board('allTime', null, 10, 5).rows.length === 0,
  );

  /* ---- ranks and the season ---------------------------------------- */

  const champion = rankFor(seats[0]);
  equal('winning a ranked match pays the full purse', champion.points, matchPoints(1, 3));
  equal('which is enough to stay in the first rank', champion.tier, 'ash');
  equal('and puts you first on the season board', champion.place, 1);
  equal('coming last earns nothing, and never goes below nothing', rankFor(seats[2]).points, 0);
  check('so the board does not list you at all', rankFor(seats[2]).place === null);

  const seasonBoard = board('season', seats[1], 10);
  equal('the season board is ranked on points', seasonBoard.rows[0]?.name, 'Abdulla');
  equal('and pins your own row wherever it is', seasonBoard.you?.name, 'Noura');
  equal('the season has an end', seasonBoard.season, seasonOf());

  recordMatch([{ userId: seats[2], score: 10 }], seats[2], 3, false);
  equal('an unranked match leaves the season alone', rankFor(seats[2]).points, 0);
  equal('though it still counts as a match played', statsFor(seats[2]).matches, 2);

  /* ---- the ladder itself ------------------------------------------- */

  equal('points below the first step are Ash', tierFor(0), 'ash');
  equal('a hundred lights a Spark', tierFor(100), 'spark');
  equal('and fifteen hundred is an Inferno', tierFor(9999), 'inferno');
  equal('a rank knows what is left to the next', standing(120).toGo, 180);
  equal('and the top of the ladder has nothing above it', standing(2000).next, null);
  equal('winning a two-handed match is worth the same as a five', matchPoints(1, 2), matchPoints(1, 5));
  equal('coming last is a small price', matchPoints(3, 3), -8);
  equal('a season is a quarter of a year', seasonOf(Date.UTC(2026, 7, 3)), '2026-Q3');
  equal('and ends when the next one starts', seasonEndsAt(Date.UTC(2026, 7, 3)), Date.UTC(2026, 9, 1));
  equal('even across a year boundary', seasonEndsAt(Date.UTC(2026, 11, 20)), Date.UTC(2027, 0, 1));

  /* ---------------------------------------------------------------- */
  /* rooms                                                             */
  /* ---------------------------------------------------------------- */

  interface Fake extends Connection {
    messages: ServerMessage[];
    tables: Array<{ view: TableView; forUser: string }>;
  }

  const fake = (id: string, name: string): Fake => {
    const connection: Fake = {
      userId: id,
      name,
      avatar: '',
      messages: [],
      tables: [],
      send(message) {
        connection.messages.push(message);
        if (message.type === 'table') connection.tables.push({ view: message.view, forUser: id });
      },
    };
    return connection;
  };

  const hub = new Hub();
  const host = fake(seats[0], 'Abdulla');
  const guest = fake(seats[1], 'Noura');
  const third = fake(seats[2], 'Salem');

  const room = hub.create(host, { targetScore: 30 });
  equal('a new room has a code', room.code.length, 6);
  check('the code avoids look-alike characters', !/[BISOZ0125]/.test(room.code));
  equal('the maker of the room hosts it', room.hostId, host.userId);
  equal('a private room is private', room.isPrivate, true);

  await throws('an unknown code is refused', () => hub.join(guest, 'ZZZZZZ'), 'no_such_room');
  hub.join(guest, room.code.toLowerCase());
  equal('codes are not case-sensitive', room.seats.length, 2);

  await throws('only the host may add bots', () => room.addBot(guest.userId, 'normal'), 'not_host');
  await throws('three at the table is the minimum', () => room.start(host.userId), 'need_players');

  room.addBot(host.userId, 'normal');
  equal('a bot takes a seat', room.seats.length, 3);
  await throws('only the host may start', () => room.start(guest.userId), 'not_host');

  const botSeat = room.seats.find((seat) => seat.isBot)!;
  room.removeSeat(host.userId, botSeat.id);
  equal('the host can clear a bot out', room.seats.length, 2);
  await throws('but cannot remove a person', () => room.removeSeat(host.userId, guest.userId), 'not_host');

  hub.join(third, room.code);
  equal('a third player joins', room.seats.length, 3);
  room.start(host.userId);
  equal('the room is playing', room.status, 'playing');
  await throws('a started room turns newcomers away', () => hub.join(fake('nobody', 'Nobody'), room.code), 'room_in_play');

  /* -------- what people say to each other -------------------------- */

  const said = (who: Fake) => who.messages.filter((message) => message.type === 'expression');
  const beforeChat = said(third).length;
  room.express(host.userId, 'laugh', guest.userId);
  equal('an expression reaches the whole table', said(third).length, beforeChat + 1);
  const heard = said(third)[beforeChat] as Extract<ServerMessage, { type: 'expression' }>;
  equal('and says who said it', heard.fromId, host.userId);
  equal('and who it was aimed at', heard.targetId, guest.userId);

  await throws(
    'but not twice in the same breath',
    () => room.express(host.userId, 'clap'),
    'too_chatty',
  );
  await sleep(EXPRESSION_LIMIT.gapMs + 40);
  room.express(host.userId, 'clap', 'nobody-at-this-table');
  const aimless = said(third).pop() as Extract<ServerMessage, { type: 'expression' }>;
  check('an aim at somebody who is not here is dropped', aimless.targetId === null);

  await throws(
    'and a made-up expression is refused',
    () => room.express(host.userId, 'shout' as never),
    'bad_message',
  );
  await throws(
    'somebody who is not at the table cannot say anything',
    () => room.express('nobody', 'laugh'),
    'not_in_room',
  );

  /* -------- the whole point: nobody sees anyone else's cards -------- */

  const leaks: string[] = [];
  const checkNoLeaks = (connection: Fake) => {
    for (const { view, forUser } of connection.tables) {
      const finished = view.phase === 'ROUND_OVER' || view.phase === 'MATCH_OVER';
      for (const player of view.players) {
        player.slots.forEach((slot, index) => {
          if (slot.kind !== 'face') return;
          if (finished) return; // everything is turned over at the showdown
          const shown = view.reveal?.targets.some(
            (target) => target.playerId === player.id && target.slot === index,
          );
          if (!shown) {
            leaks.push(
              `${forUser} could see ${player.id} slot ${index} (${slot.card.rank}) during ${view.phase}`,
            );
          }
        });
      }
      if (view.held?.kind === 'face') {
        const holder = view.players[view.turn];
        if (holder.id !== forUser && !finished) {
          leaks.push(`${forUser} could see the card in ${holder.id}'s hand`);
        }
      }
      if (view.reveal && view.reveal.viewerId !== forUser && view.reveal.viewerId !== '*') {
        leaks.push(`${forUser} was told about ${view.reveal.viewerId}'s private look`);
      }
    }
  };

  /* Play the match out through the room, as three separate phones. */
  const players: Record<string, Fake> = {
    [host.userId]: host,
    [guest.userId]: guest,
    [third.userId]: third,
  };

  const latest = (who: Fake): TableView | null =>
    who.tables.length ? who.tables[who.tables.length - 1].view : null;

  // Left to themselves three people would swap cards until the heat death of
  // the universe, so this stand-in knocks once a round has run long enough.
  let turnsThisRound = 0;
  let roundSeen = 0;

  /** A legal move for whoever the table is waiting on, from their own view. */
  const moveFor = (view: TableView): GameAction | null => {
    const me = view.players.find((player) => player.id === view.youId)!;
    const live = me.slots
      .map((slot, index) => (slot.kind === 'burned' ? -1 : index))
      .filter((index) => index >= 0);

    if (view.reveal && view.reveal.viewerId === view.youId) {
      return { type: 'ACK_REVEAL', playerId: view.youId };
    }
    if (view.phase === 'OPENING_PEEK' && view.openingPeeksLeft > 0) {
      const shown = view.reveal?.targets.map((target) => target.slot) ?? [];
      const next = live.find((slot) => !shown.includes(slot));
      return next == null ? null : { type: 'OPENING_PEEK', playerId: view.youId, slot: next };
    }
    if (view.players[view.turn].id !== view.youId) return null;
    if (view.round !== roundSeen) {
      roundSeen = view.round;
      turnsThisRound = 0;
    }
    if (view.phase === 'TURN_START') {
      turnsThisRound += 1;
      if (!view.knockerId && turnsThisRound > 9) return { type: 'KNOCK' };
      return { type: 'DRAW_STOCK' };
    }
    if (view.phase === 'HOLDING') return { type: 'PLACE', slot: live[0] ?? 0 };
    if (view.phase === 'POWER') {
      const power = view.power!;
      const rival = view.players.find((player) => player.id !== view.youId)!;
      if (power.kind === 'PEEK') return { type: 'POWER_TARGET', playerId: view.youId, slot: live[0] };
      if (power.kind === 'SPY' || power.kind === 'EMBER') {
        return { type: 'POWER_TARGET', playerId: rival.id, slot: 0 };
      }
      if (power.kind === 'SWAP') {
        return power.picked.length === 0
          ? { type: 'POWER_TARGET', playerId: view.youId, slot: live[0] }
          : { type: 'POWER_TARGET', playerId: rival.id, slot: 0 };
      }
      if (power.kind === 'LOOK_SWAP') {
        return power.picked.length === 0
          ? { type: 'POWER_TARGET', playerId: rival.id, slot: 0 }
          : { type: 'POWER_DECLINE' };
      }
    }
    return null;
  };

  let steps = 0;
  let refusals = 0;
  while (steps < 4000) {
    const state = latest(host);
    if (state && (state.phase === 'MATCH_OVER' || room.status === 'finished')) break;

    let acted = false;
    for (const who of Object.values(players)) {
      const view = latest(who);
      if (!view) continue;
      const move = moveFor(view);
      if (!move) continue;
      try {
        room.submit(who.userId, move);
        acted = true;
      } catch {
        refusals += 1;
      }
      steps += 1;
    }
    if (!acted) await sleep(30);
    steps += 1;
  }

  for (const who of Object.values(players)) checkNoLeaks(who);

  equal('the match finishes', room.status, 'finished');
  check('the table was busy', host.tables.length > 30, `${host.tables.length} updates`);
  check('no player ever saw a card they should not have', leaks.length === 0, leaks.slice(0, 3).join('; '));

  const finalView = latest(host)!;
  check('somebody won the match', finalView.matchWinnerId != null);
  equal('the match was scored', statsFor(host.userId).matches, 2);

  /* -------- acting out of turn -------- */

  const hub2 = new Hub();
  const a = fake(seats[0], 'Abdulla');
  const b = fake(seats[1], 'Noura');
  const c = fake(seats[2], 'Salem');
  const room2 = hub2.create(a, { targetScore: 100 });
  hub2.join(b, room2.code);
  hub2.join(c, room2.code);
  room2.start(a.userId);

  // Everyone is still choosing their opening look, so nobody may draw.
  await throws('you cannot draw during the opening look', () => room2.submit(a.userId, { type: 'DRAW_STOCK' }), 'not_your_move');
  await throws('you cannot peek at a rival', () => room2.submit(a.userId, { type: 'OPENING_PEEK', playerId: b.userId, slot: 0 }), 'not_your_move');
  await throws('you cannot put away a look you were not shown', () => room2.submit(a.userId, { type: 'ACK_REVEAL', playerId: b.userId }), 'not_your_move');
  await throws('you cannot deal the next round yourself', () => room2.submit(a.userId, { type: 'NEXT_ROUND' }), 'not_your_move');
  await throws('and a stranger cannot act at all', () => room2.submit('stranger', { type: 'DRAW_STOCK' }), 'not_in_room');

  for (const who of [a, b, c]) {
    let guard = 0;
    while (guard < 6) {
      const view = latest(who);
      const move = view ? moveFor(view) : null;
      if (!move) break;
      room2.submit(who.userId, move);
      guard += 1;
    }
  }
  await sleep(60);
  const afterPeek = latest(a)!;
  equal('play begins once everyone has looked', afterPeek.phase, 'TURN_START');

  const outOfTurn = afterPeek.players.find((player) => player.id !== afterPeek.players[afterPeek.turn].id)!;
  await throws(
    'a player cannot move on somebody else\'s turn',
    () => room2.submit(outOfTurn.id, { type: 'DRAW_STOCK' }),
    'not_your_move',
  );

  /* -------- dropping out and coming back -------- */

  hub2.disconnect(c.userId);
  equal('a dropped player keeps their seat', room2.seats.length, 3);
  equal('and is shown as away', room2.seats.find((seat) => seat.id === c.userId)?.connected, false);
  hub2.join(c, room2.code);
  equal('and gets it back on return', room2.seats.find((seat) => seat.id === c.userId)?.connected, true);

  const carried = latest(c)!;
  equal('the table is still there', carried.round >= 1, true);

  /* -------- quick match -------- */

  const hub3 = new Hub();
  const solo = fake(seats[0], 'Abdulla');
  const queued = hub3.quickMatch(solo);
  equal('quick match opens a public table', queued.isPrivate, false);
  equal('and seats you at it', queued.seats.length, 1);
  check('with a countdown', (queued.quickMatchStartsAt ?? 0) > Date.now());

  const friend = fake(seats[1], 'Noura');
  const joined = hub3.quickMatch(friend);
  equal('the next player lands at the same table', joined.code, queued.code);
  equal('which now has two', joined.seats.length, 2);

  // Nobody else turns up, so the wait runs out and bots fill the table.
  await sleep(1400);
  equal('the wait fills the empty seats with bots', queued.seats.length >= 3, true);
  equal('and deals', queued.status, 'playing');
  check('the people kept their seats', queued.seats.filter((seat) => !seat.isBot).length === 2);
  hub3.stop();

  /* -------- a table nobody is left at closes -------- */
  hub2.disconnect(a.userId);
  hub2.disconnect(b.userId);
  hub2.disconnect(c.userId);
  equal('an empty table is cleared away', hub2.roomFor(a.userId), undefined);

  hub.stop();
  hub2.stop();

  /* ---------------------------------------------------------------- */

  // eslint-disable-next-line no-console
  console.log(`\n  ${passed} checks passed`);
  if (failures.length) {
    // eslint-disable-next-line no-console
    console.log(`  ${failures.length} failed:\n`);
    for (const failure of failures) console.log(`   ✗ ${failure}`);
    process.exit(1);
  }
  // eslint-disable-next-line no-console
  console.log('  all good\n');
  process.exit(0);
}

void main();

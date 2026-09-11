/**
 * Rules tests for EMBER. Pure node — no React Native, no test runner.
 * Run with `npm test`.
 */

import { buildDeck, powerOf, valueOf } from '../shared/cards';
import {
  burnExpired,
  cardsLeft,
  createMatch,
  currentPlayer,
  handTotal,
  HUMAN_ID,
  playerById,
  publicReveal,
  reduce,
  revealFor,
  topDiscard,
} from '../shared/engine';
import { decide, decideBurn, observeTransition, seedMemory, type BotMemory } from '../shared/ai';
import type { GameAction, GameState } from '../shared/types';

let passed = 0;
const failures: string[] = [];

function check(name: string, condition: boolean, detail = ''): void {
  if (condition) {
    passed += 1;
  } else {
    failures.push(`${name}${detail ? ` — ${detail}` : ''}`);
  }
}

function equal(name: string, actual: unknown, expected: unknown): void {
  check(name, Object.is(actual, expected), `expected ${String(expected)}, got ${String(actual)}`);
}

/* ------------------------------------------------------------------ */
/* the deck                                                            */
/* ------------------------------------------------------------------ */

const deck = buildDeck();
equal('deck has 108 cards', deck.length, 108);
equal('deck has 4 jokers', deck.filter((c) => c.rank === 'JOKER').length, 4);
equal('deck has unique ids', new Set(deck.map((c) => c.id)).size, 108);

equal('red king is worth nothing', valueOf('K', 'H'), 0);
equal('black king is worth 13', valueOf('K', 'S'), 13);
equal('joker is worth 15', valueOf('JOKER', null), 15);
equal('ace is worth 1', valueOf('A', 'C'), 1);
equal('ten is worth 10', valueOf('10', 'D'), 10);
equal('queen is worth 12', valueOf('Q', 'S'), 12);

equal('sevens peek', powerOf('7', 'H'), 'PEEK');
equal('nines spy', powerOf('9', 'H'), 'SPY');
equal('jacks swap', powerOf('J', 'H'), 'SWAP');
equal('black kings look and swap', powerOf('K', 'S'), 'LOOK_SWAP');
equal('red kings have no power', powerOf('K', 'D'), null);
equal('jokers ember', powerOf('JOKER', null), 'EMBER');

const deckTotal = deck.reduce((sum, card) => sum + card.value, 0);
equal('two decks total 736 points', deckTotal, 736);

/* ------------------------------------------------------------------ */
/* dealing                                                             */
/* ------------------------------------------------------------------ */

function countCards(state: GameState): number {
  const inHands = state.players.reduce((sum, p) => sum + p.slots.filter(Boolean).length, 0);
  return inHands + state.stock.length + state.discard.length + (state.held ? 1 : 0);
}

const fresh = createMatch({ seed: 1234 });
equal('three players by default', fresh.players.length, 3);
equal('everyone gets four cards', fresh.players.every((p) => p.slots.length === 4), true);
equal('one card starts the discard', fresh.discard.length, 1);
equal('no card goes missing on the deal', countCards(fresh), 108);
equal('opening peek comes first', fresh.phase, 'OPENING_PEEK');
equal('only the human chooses peeks', Object.keys(fresh.openingPeeksLeft).length, 1);

let peeked = reduce(fresh, { type: 'OPENING_PEEK', playerId: HUMAN_ID, slot: 0 });
peeked = reduce(peeked, { type: 'OPENING_PEEK', playerId: HUMAN_ID, slot: 1 });
equal('both peeks show at once', revealFor(peeked, HUMAN_ID)?.targets.length, 2);
peeked = reduce(peeked, { type: 'OPENING_PEEK', playerId: HUMAN_ID, slot: 2 });
equal('a third peek is refused', revealFor(peeked, HUMAN_ID)?.targets.length, 2);
const playing = reduce(peeked, { type: 'ACK_REVEAL', playerId: HUMAN_ID });
equal('play begins after the peek', playing.phase, 'TURN_START');

/* ------------------------------------------------------------------ */
/* a hand-built round                                                  */
/* ------------------------------------------------------------------ */

/** Puts a known card into a slot so a rule can be tested in isolation. */
function stack(state: GameState, playerId: string, slot: number, cardId: string): GameState {
  const next: GameState = JSON.parse(JSON.stringify(state));
  const card = buildDeck().find((c) => c.id === cardId);
  if (!card) throw new Error(`no such card ${cardId}`);
  const player = playerById(next, playerId);
  if (!player) throw new Error(`no such player ${playerId}`);
  player.slots[slot] = card;
  return next;
}

// Drawing from the discard means you have to keep it.
let forced = playing;
const topBefore = topDiscard(forced);
forced = reduce(forced, { type: 'DRAW_DISCARD' });
equal('taking the discard leaves you holding it', forced.held?.id, topBefore?.id);
const refused = reduce(forced, { type: 'THROW', usePower: true });
equal('a taken card cannot be thrown straight back', refused.phase, 'HOLDING');
const placed = reduce(forced, { type: 'PLACE', slot: 0 });
equal('placing puts the old card on the pile', topDiscard(placed)?.id !== topBefore?.id, true);
equal('placing opens the burn window', placed.phase, 'BURN_WINDOW');
equal('no card goes missing on a swap', countCards(placed), 108);

/* burning ---------------------------------------------------------- */

// Give the human a card matching the top of the discard, then burn it.
const burnTop = topDiscard(placed);
const matching = buildDeck().find(
  (c) => c.rank === burnTop?.rank && c.id !== burnTop?.id && !placed.players.some((p) => p.slots.some((s) => s?.id === c.id)),
);
let burning = stack(placed, currentPlayer(placed).id === HUMAN_ID ? 'bot1' : HUMAN_ID, 2, matching!.id);
const burner = currentPlayer(placed).id === HUMAN_ID ? 'bot1' : HUMAN_ID;
const beforeBurn = cardsLeft(playerById(burning, burner)!);
burning = reduce(burning, { type: 'BURN', playerId: burner, ownerId: burner, slot: 2 });
equal('a good burn removes the card', cardsLeft(playerById(burning, burner)!), beforeBurn - 1);
equal('a burned card goes on the pile', topDiscard(burning)?.id, matching!.id);
equal('one burn attempt per window', reduce(burning, { type: 'BURN', playerId: burner, ownerId: burner, slot: 0 }).logSeq, burning.logSeq);

/* burning somebody else's card ------------------------------------- */

// Knowing what a rival holds is worth something: their card goes, and what
// replaces it comes off the stock, so they are left holding something nobody
// at the table can name.
const victim = placed.players.find((p) => p.id !== burner)!.id;
const theirMatch = buildDeck().find(
  (c) =>
    c.rank === burnTop?.rank &&
    c.id !== burnTop?.id &&
    c.id !== matching!.id &&
    !placed.players.some((p) => p.slots.some((slot) => slot?.id === c.id)),
)!;
let raid = stack(placed, victim, 1, theirMatch.id);
const theirCountBefore = cardsLeft(playerById(raid, victim)!);
const myCountBefore = cardsLeft(playerById(raid, burner)!);
raid = reduce(raid, { type: 'BURN', playerId: burner, ownerId: victim, slot: 1 });

equal('their card is taken', playerById(raid, victim)!.slots[1]?.id !== theirMatch.id, true);
equal('but the slot is not left empty', playerById(raid, victim)!.slots[1] != null, true);
equal('so their pile is the same size', cardsLeft(playerById(raid, victim)!), theirCountBefore);
equal('and yours is too', cardsLeft(playerById(raid, burner)!), myCountBefore);
equal('the burned card lands on the pile', topDiscard(raid)?.id, theirMatch.id);
equal('what replaces it comes off the stock', raid.stock.length, placed.stock.length - 1);
equal('nobody is shown the new card', raid.reveals.length, 0);
equal('no card goes missing in a raid', countCards(raid), 108);

// Reaching for a rival's card and getting it wrong costs the person reaching.
const theirWrong = buildDeck().find((c) => c.rank !== burnTop?.rank && c.rank !== 'JOKER')!;
let raidMiss = stack(placed, victim, 2, theirWrong.id);
const missMine = cardsLeft(playerById(raidMiss, burner)!);
const missTheirs = cardsLeft(playerById(raidMiss, victim)!);
raidMiss = reduce(raidMiss, { type: 'BURN', playerId: burner, ownerId: victim, slot: 2 });
equal('a wrong grab costs the grabber', cardsLeft(playerById(raidMiss, burner)!), missMine + 1);
equal('and costs its owner nothing', cardsLeft(playerById(raidMiss, victim)!), missTheirs);
equal('their card is turned over for everyone', publicReveal(raidMiss)?.targets[0].playerId, victim);

// A misfire hands you a penalty card instead.
const wrongRank = buildDeck().find((c) => c.rank !== burnTop?.rank && c.rank !== 'JOKER')!;
let misfire = stack(placed, burner, 3, wrongRank.id);
const beforeMisfire = cardsLeft(playerById(misfire, burner)!);
misfire = reduce(misfire, { type: 'BURN', playerId: burner, ownerId: burner, slot: 3 });
equal('a misfire costs you a card', cardsLeft(playerById(misfire, burner)!), beforeMisfire + 1);
equal('a misfire is shown to everyone', publicReveal(misfire)?.viewerId, '*');
equal('the window will not close mid-misfire', reduce(misfire, { type: 'CLOSE_BURN', now: 0 }).phase, 'BURN_WINDOW');
const cleared = reduce(misfire, { type: 'ACK_REVEAL', playerId: '*' });
equal('the window reopens after the misfire is seen', cleared.phase, 'BURN_WINDOW');

/* bots know whose card is worth burning ---------------------------- */

// Replacing a rival's card costs them nothing if what they had was expensive,
// so a bot that burns a rival's Joker is doing them a favour.
const raider = 'bot1';
const mark = HUMAN_ID;

let joker = stack(placed, mark, 0, 'JOKERX-1');
joker.burn = { rank: 'JOKER', closesAt: 1, attempted: [] };
const knowsJoker: BotMemory = { [`${mark}:0`]: { cardId: 'JOKERX-1', rank: 'JOKER', value: 15 } };
equal("a bot leaves a rival's Joker alone", decideBurn(joker, raider, knowsJoker, () => 0), null);

let ace = stack(placed, mark, 1, 'AH-1');
ace.burn = { rank: 'A', closesAt: 1, attempted: [] };
const knowsAce: BotMemory = { [`${mark}:1`]: { cardId: 'AH-1', rank: 'A', value: 1 } };
const raidMove = decideBurn(ace, raider, knowsAce, () => 0);
check(
  "but takes a rival's cheap card",
  raidMove?.type === 'BURN' && raidMove.ownerId === mark && raidMove.slot === 1,
  JSON.stringify(raidMove),
);

// Its own matching card comes first either way: that one actually leaves.
let both = stack(ace, raider, 2, 'AS-1');
const knowsBoth: BotMemory = {
  ...knowsAce,
  [`${raider}:2`]: { cardId: 'AS-1', rank: 'A', value: 1 },
};
const ownMove = decideBurn(both, raider, knowsBoth, () => 0);
check(
  'and its own card comes first',
  ownMove?.type === 'BURN' && ownMove.ownerId === raider,
  JSON.stringify(ownMove),
);

/* the burn window's clock ------------------------------------------ */
equal('the window is open before it expires', burnExpired(placed, 0), false);
equal('the window expires on time', burnExpired(placed, placed.burn!.closesAt + 1), true);

/* knocking --------------------------------------------------------- */

let knocked = reduce(playing, { type: 'KNOCK' });
equal('knocking names the knocker', knocked.knockerId, currentPlayer(playing).id);
equal('knocking passes the turn', knocked.phase, 'TURN_START');
equal('the knocker gets no more turns', knocked.turnsSinceKnock, 0);
equal('a second knock is refused', reduce(knocked, { type: 'KNOCK' }).knockerId, knocked.knockerId);

// Everyone else takes exactly one more turn, then the round is scored.
let closing = knocked;
for (let i = 0; i < knocked.players.length - 1; i++) {
  closing = reduce(closing, { type: 'DRAW_STOCK' });
  closing = reduce(closing, { type: 'THROW', usePower: false });
  if (closing.phase === 'POWER') closing = reduce(closing, { type: 'POWER_DECLINE' });
  if (closing.phase === 'BURN_WINDOW') closing = reduce(closing, { type: 'CLOSE_BURN', now: 0 });
}
equal('the round ends after one turn each', closing.phase === 'ROUND_OVER' || closing.phase === 'MATCH_OVER', true);
check('the round has a result', closing.result != null);

const result = closing.result!;
const knockerTotal = result.totals[result.knockerId!];
const others = closing.players.filter((p) => p.id !== result.knockerId);
const knockerIsLowest = others.every((p) => result.totals[p.id] > knockerTotal);
equal('a knock is judged on the totals', result.knockSucceeded, knockerIsLowest);
equal(
  'a good knock scores nothing, a bad one costs ten',
  result.scored[result.knockerId!],
  knockerIsLowest ? 0 : knockerTotal + 10,
);
for (const player of others) {
  equal(`${player.name} scores their pile`, result.scored[player.id], result.totals[player.id]);
}
equal(
  'scores carry into the match',
  closing.players.every((p) => p.matchScore === result.scored[p.id]),
  true,
);

/* ------------------------------------------------------------------ */
/* powers                                                              */
/* ------------------------------------------------------------------ */

function holdingCard(base: GameState, cardId: string): GameState {
  const next: GameState = JSON.parse(JSON.stringify(base));
  const card = buildDeck().find((c) => c.id === cardId)!;
  next.stock = next.stock.filter((c) => c.id !== cardId);
  next.held = card;
  next.heldFromDiscard = false;
  next.phase = 'HOLDING';
  return next;
}

const actor = currentPlayer(playing);
const rival = playing.players.find((p) => p.id !== actor.id)!;

// Peek shows one of your own cards, and only yours.
let peek = holdingCard(playing, '7H-1');
peek = reduce(peek, { type: 'THROW', usePower: true });
equal('a seven starts a peek', peek.power?.kind, 'PEEK');
equal('peek cannot target a rival', reduce(peek, { type: 'POWER_TARGET', playerId: rival.id, slot: 0 }).phase, 'POWER');
peek = reduce(peek, { type: 'POWER_TARGET', playerId: actor.id, slot: 0 });
equal('peek shows the card to you alone', revealFor(peek, actor.id)?.viewerId, actor.id);
equal('and to nobody else', revealFor(peek, rival.id), undefined);
peek = reduce(peek, { type: 'ACK_REVEAL', playerId: actor.id });
equal('the turn continues after a peek', peek.phase, 'BURN_WINDOW');

// Spy shows a rival's card, and only a rival's.
let spy = holdingCard(playing, '9S-1');
spy = reduce(spy, { type: 'THROW', usePower: true });
equal('spy cannot target yourself', reduce(spy, { type: 'POWER_TARGET', playerId: actor.id, slot: 0 }).phase, 'POWER');
spy = reduce(spy, { type: 'POWER_TARGET', playerId: rival.id, slot: 1 });
equal('spy shows a rival card to you', revealFor(spy, actor.id)?.targets[0].playerId, rival.id);
equal('and the rival is not told', revealFor(spy, rival.id), undefined);

// A jack swaps blind, in the order yours-then-theirs.
let swap = holdingCard(playing, 'JD-1');
swap = reduce(swap, { type: 'THROW', usePower: true });
const mineBefore = playerById(swap, actor.id)!.slots[0]!.id;
const theirsBefore = playerById(swap, rival.id)!.slots[2]!.id;
equal('a swap starts with your own card', reduce(swap, { type: 'POWER_TARGET', playerId: rival.id, slot: 0 }).power?.picked.length, 0);
swap = reduce(swap, { type: 'POWER_TARGET', playerId: actor.id, slot: 0 });
swap = reduce(swap, { type: 'POWER_TARGET', playerId: rival.id, slot: 2 });
equal('a swap moves your card across', playerById(swap, rival.id)!.slots[2]!.id, mineBefore);
equal('a swap brings theirs back', playerById(swap, actor.id)!.slots[0]!.id, theirsBefore);
equal('a swap shows nobody anything', swap.reveals.length, 0);
equal('the turn continues after a swap', swap.phase, 'BURN_WINDOW');

// A black king looks first and may then decline.
let king = holdingCard(playing, 'KS-1');
king = reduce(king, { type: 'THROW', usePower: true });
equal('a black king looks and swaps', king.power?.kind, 'LOOK_SWAP');
king = reduce(king, { type: 'POWER_TARGET', playerId: rival.id, slot: 3 });
equal('the king looks at a rival first', revealFor(king, actor.id)?.reason, 'look_swap');
king = reduce(king, { type: 'ACK_REVEAL', playerId: actor.id });
equal('the king then waits for your choice', king.phase, 'POWER');
const declined = reduce(king, { type: 'POWER_DECLINE' });
equal('you may leave it where it is', declined.phase, 'BURN_WINDOW');
const kingMine = playerById(king, actor.id)!.slots[1]!.id;
const kingTheirs = playerById(king, rival.id)!.slots[3]!.id;
const took = reduce(king, { type: 'POWER_TARGET', playerId: actor.id, slot: 1 });
equal('or take it for yourself', playerById(took, actor.id)!.slots[1]!.id, kingTheirs);
equal('leaving yours behind', playerById(took, rival.id)!.slots[3]!.id, kingMine);

// A joker forces a card onto someone else.
let ember = holdingCard(playing, 'JOKERX-1');
ember = reduce(ember, { type: 'THROW', usePower: true });
equal('a joker embers', ember.power?.kind, 'EMBER');
const rivalCards = playerById(ember, rival.id)!.slots.length;
equal('ember cannot target yourself', reduce(ember, { type: 'POWER_TARGET', playerId: actor.id, slot: 0 }).phase, 'POWER');
ember = reduce(ember, { type: 'POWER_TARGET', playerId: rival.id, slot: 0 });
equal('ember hands a rival an extra card', playerById(ember, rival.id)!.slots.length, rivalCards + 1);
equal('no card goes missing on an ember', countCards(ember), 108);

// A red king is a free zero and carries no power at all.
let redKing = holdingCard(playing, 'KH-1');
redKing = reduce(redKing, { type: 'THROW', usePower: true });
equal('a red king has nothing to spend', redKing.phase, 'BURN_WINDOW');

/* ------------------------------------------------------------------ */
/* ash out                                                             */
/* ------------------------------------------------------------------ */

let ash: GameState = JSON.parse(JSON.stringify(placed));
const ashPlayer = playerById(ash, burner)!;
const ashTop = topDiscard(ash)!;
ashPlayer.slots = [buildDeck().find((c) => c.rank === ashTop.rank && c.id !== ashTop.id)!];
ash = reduce(ash, { type: 'BURN', playerId: burner, ownerId: burner, slot: 0 });
equal('emptying your pile ends the round', ash.phase === 'ROUND_OVER' || ash.phase === 'MATCH_OVER', true);
equal('an ash out wins the round', ash.result?.ashOutId, burner);
equal('an ash out scores nothing', ash.result?.scored[burner], 0);

/* ------------------------------------------------------------------ */
/* full matches, played by the bots                                    */
/* ------------------------------------------------------------------ */

/** Plays a whole match with every seat driven by the bot logic. */
function playMatch(seed: number): { state: GameState; steps: number; invariant: boolean } {
  let state = createMatch({
    seed,
    bots: [
      { name: 'A', difficulty: 'easy' },
      { name: 'B', difficulty: 'normal' },
      { name: 'C', difficulty: 'sharp' },
    ],
  });

  const memories: Record<string, BotMemory> = {};
  for (const player of state.players) memories[player.id] = seedMemory(state, player.id);

  let steps = 0;
  let invariant = true;
  let clock = 0;
  // A deterministic stand-in for Math.random so runs repeat exactly.
  let noise = seed;
  const random = () => {
    noise = (noise * 1103515245 + 12345) % 2147483648;
    return noise / 2147483648;
  };

  const apply = (action: GameAction) => {
    const previous = state;
    state = reduce(state, action, clock);
    for (const player of state.players) {
      memories[player.id] = observeTransition(memories[player.id], previous, state, player.id, random);
    }
    steps += 1;
    clock += 10;
    if (countCards(state) !== 108) invariant = false;
  };

  while (state.phase !== 'MATCH_OVER' && steps < 20000) {
    switch (state.phase) {
      case 'OPENING_PEEK': {
        const pending = Object.entries(state.openingPeeksLeft).find(([, left]) => left > 0);
        if (pending) {
          const [playerId, left] = pending;
          apply({ type: 'OPENING_PEEK', playerId, slot: state.config.openingPeeks - left });
        } else {
          apply({ type: 'ACK_REVEAL', playerId: HUMAN_ID });
        }
        break;
      }
      case 'BURN_WINDOW': {
        if (state.reveals.length) {
          apply({ type: 'ACK_REVEAL', playerId: state.reveals[0].viewerId });
          break;
        }
        const attempt = state.players
          .map((p) => decideBurn(state, p.id, memories[p.id], random))
          .find(Boolean);
        if (attempt) apply(attempt);
        else apply({ type: 'CLOSE_BURN', now: clock });
        break;
      }
      case 'ROUND_OVER':
        apply({ type: 'NEXT_ROUND' });
        break;
      default: {
        if (state.reveals.length) {
          apply({ type: 'ACK_REVEAL', playerId: state.reveals[0].viewerId });
          break;
        }
        const seat = currentPlayer(state);
        const move = decide(state, seat.id, memories[seat.id]);
        if (!move) {
          steps = 20000; // a stuck game is a failure, not a loop
          break;
        }
        apply(move);
      }
    }
  }

  return { state, steps, invariant };
}

let completed = 0;
let invariantsHeld = true;
let roundsPlayed = 0;
let knocks = 0;
for (let seed = 1; seed <= 60; seed++) {
  const run = playMatch(seed);
  if (run.state.phase === 'MATCH_OVER' && run.steps < 20000) completed += 1;
  if (!run.invariant) invariantsHeld = false;
  roundsPlayed += run.state.round;
  if (run.state.result?.knockerId) knocks += 1;
}

equal('sixty bot matches all finish', completed, 60);
equal('no card is ever lost or duplicated', invariantsHeld, true);
check('matches take several rounds', roundsPlayed / 60 > 1.5, `average ${(roundsPlayed / 60).toFixed(1)} rounds`);
check('bots do knock', knocks > 0, `${knocks} of 60 matches ended on a knock`);

const sample = playMatch(7);
const winner = playerById(sample.state, sample.state.matchWinnerId!)!;
equal(
  'the lowest score wins the match',
  sample.state.players.every((p) => p.matchScore >= winner.matchScore),
  true,
);
check(
  'somebody reached the target',
  sample.state.players.some((p) => p.matchScore >= sample.state.config.targetScore),
);

/* the same seed must always play out the same way ------------------- */
const runA = playMatch(21);
const runB = playMatch(21);
equal('a seed replays exactly', JSON.stringify(runA.state), JSON.stringify(runB.state));

/* bots must not see through the table ------------------------------- */
const blind = createMatch({ seed: 99 });
const blindMemory = seedMemory(blind, 'bot1');
equal('a bot starts knowing only its own two cards', Object.keys(blindMemory).length, 2);
equal(
  'and nothing about anyone else',
  Object.keys(blindMemory).every((k) => k.startsWith('bot1:')),
  true,
);
const afterTurn = observeTransition(blindMemory, blind, reduce(reduce(blind, { type: 'OPENING_PEEK', playerId: HUMAN_ID, slot: 0 }), { type: 'ACK_REVEAL', playerId: HUMAN_ID }), 'bot1', () => 0);
equal(
  'a bot learns nothing from your peek',
  Object.keys(afterTurn).every((k) => k.startsWith('bot1:')),
  true,
);

/* ------------------------------------------------------------------ */

console.log(`\n  ${passed} checks passed`);
if (failures.length) {
  console.log(`  ${failures.length} failed:\n`);
  for (const failure of failures) console.log(`   ✗ ${failure}`);
  process.exit(1);
}
console.log('  all good\n');

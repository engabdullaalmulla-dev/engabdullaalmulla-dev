import { buildShuffledDeck } from './cards';
import { shuffle } from './rng';
import type {
  Card,
  CardRef,
  Difficulty,
  GameAction,
  GameConfig,
  GameState,
  LogEntry,
  LogKey,
  Player,
  Reveal,
  RoundResult,
} from './types';

export const DEFAULT_CONFIG: GameConfig = {
  handSize: 4,
  openingPeeks: 2,
  knockPenalty: 10,
  targetScore: 100,
  burnWindowMs: 3200,
};

export const HUMAN_ID = 'you';

export interface MatchOptions {
  seed?: number;
  /** Name shown for the human player. */
  playerName?: string;
  /** Bots to deal in. Three players is the minimum the box calls for. */
  bots?: Array<{ name: string; difficulty: Difficulty }>;
  /**
   * An explicit seating, used online where every seat is a real account and
   * there is no single "you". Takes precedence over playerName and bots.
   */
  seats?: Array<{ id: string; name: string; isBot: boolean; difficulty?: Difficulty }>;
  config?: Partial<GameConfig>;
}

const DEFAULT_BOTS: Array<{ name: string; difficulty: Difficulty }> = [
  { name: 'Rashid', difficulty: 'normal' },
  { name: 'Noura', difficulty: 'normal' },
];

/* ------------------------------------------------------------------ */
/* small helpers                                                       */
/* ------------------------------------------------------------------ */

function clone(state: GameState): GameState {
  return JSON.parse(JSON.stringify(state)) as GameState;
}

export function currentPlayer(state: GameState): Player {
  return state.players[state.turn];
}

export function playerById(state: GameState, id: string): Player | undefined {
  return state.players.find((p) => p.id === id);
}

/** The card, if any, currently face up for this viewer. */
export function revealFor(state: GameState, viewerId: string): Reveal | undefined {
  return state.reveals.find(
    (reveal) => reveal.viewerId === viewerId || reveal.viewerId === '*',
  );
}

/** A card the whole table is looking at, which holds up the burn window. */
export function publicReveal(state: GameState): Reveal | undefined {
  return state.reveals.find((reveal) => reveal.viewerId === '*');
}

function dropReveal(state: GameState, viewerId: string): Reveal | undefined {
  const index = state.reveals.findIndex((reveal) => reveal.viewerId === viewerId);
  if (index < 0) return undefined;
  return state.reveals.splice(index, 1)[0];
}

function setReveal(state: GameState, reveal: Reveal): void {
  dropReveal(state, reveal.viewerId);
  state.reveals.push(reveal);
}

export function topDiscard(state: GameState): Card | null {
  return state.discard.length ? state.discard[state.discard.length - 1] : null;
}

export function handTotal(player: Player): number {
  return player.slots.reduce((sum, slot) => sum + (slot ? slot.value : 0), 0);
}

export function cardsLeft(player: Player): number {
  return player.slots.filter(Boolean).length;
}

/** Records what happened. The wording is the phone's business, not ours. */
function log(
  state: GameState,
  kind: LogEntry['kind'],
  key: LogKey,
  parts: Omit<LogEntry, 'id' | 'kind' | 'key'> = {},
): void {
  state.log.push({ id: state.logSeq++, kind, key, ...parts });
  if (state.log.length > 40) state.log.splice(0, state.log.length - 40);
}

/** Just enough of a card to name it later. */
function ref(card: Card): CardRef {
  return { rank: card.rank, suit: card.suit };
}

/** Draws one card, folding the discard pile back in when the stock runs dry. */
function drawCard(state: GameState): Card | null {
  if (state.stock.length === 0) {
    if (state.discard.length <= 1) return null;
    const top = state.discard.pop() as Card;
    const reshuffled = shuffle(state.discard, state.rng);
    state.stock = reshuffled.items;
    state.rng = reshuffled.seed;
    state.discard = [top];
    log(state, 'info', 'reshuffled');
  }
  return state.stock.pop() ?? null;
}

/* ------------------------------------------------------------------ */
/* set-up                                                              */
/* ------------------------------------------------------------------ */

export function createMatch(options: MatchOptions = {}): GameState {
  const config = { ...DEFAULT_CONFIG, ...(options.config ?? {}) };
  const bots = options.bots ?? DEFAULT_BOTS;

  const players: Player[] = options.seats
    ? options.seats.map((seat) => ({
        id: seat.id,
        name: seat.name,
        isBot: seat.isBot,
        difficulty: seat.difficulty ?? 'normal',
        slots: [],
        matchScore: 0,
      }))
    : [
    {
      id: HUMAN_ID,
      name: options.playerName ?? 'You',
      isBot: false,
      difficulty: 'normal',
      slots: [],
      matchScore: 0,
    },
    ...bots.map((bot, index) => ({
      id: `bot${index + 1}`,
      name: bot.name,
      isBot: true,
      difficulty: bot.difficulty,
      slots: [],
      matchScore: 0,
    })),
  ];

  const base: GameState = {
    players,
    turn: 0,
    phase: 'OPENING_PEEK',
    stock: [],
    discard: [],
    held: null,
    heldFromDiscard: false,
    power: null,
    reveals: [],
    burn: null,
    knockerId: null,
    turnsSinceKnock: 0,
    round: 0,
    result: null,
    matchWinnerId: null,
    openingPeeksLeft: {},
    log: [],
    logSeq: 1,
    rng: options.seed ?? Math.floor(Math.random() * 2 ** 31),
    config,
  };

  return dealRound(base);
}

/** Shuffles, deals, and puts the game back at the opening peek. */
export function dealRound(previous: GameState): GameState {
  const state = clone(previous);
  const deck = buildShuffledDeck(state.rng);
  state.rng = deck.seed;

  const cards = deck.cards;
  state.round += 1;
  state.players = state.players.map((player) => ({ ...player, slots: [] }));

  for (let i = 0; i < state.config.handSize; i++) {
    for (const player of state.players) {
      player.slots.push(cards.pop() as Card);
    }
  }

  state.discard = [cards.pop() as Card];
  state.stock = cards;
  state.held = null;
  state.heldFromDiscard = false;
  state.power = null;
  state.reveals = [];
  state.burn = null;
  state.knockerId = null;
  state.turnsSinceKnock = 0;
  state.result = null;
  state.phase = 'OPENING_PEEK';

  // Bots memorise their two nearest cards automatically (see ai.ts); only the
  // human has to choose which two to look at.
  state.openingPeeksLeft = {};
  for (const player of state.players) {
    if (!player.isBot) state.openingPeeksLeft[player.id] = state.config.openingPeeks;
  }

  // The deal rotates each round, so nobody keeps the first-turn advantage.
  state.turn = (state.round - 1) % state.players.length;
  state.log = [];
  log(state, 'info', 'round_dealt', { count: state.round });
  return state;
}

/* ------------------------------------------------------------------ */
/* turn plumbing                                                       */
/* ------------------------------------------------------------------ */

function openBurnWindow(state: GameState, now: number): void {
  const top = topDiscard(state);
  if (!top) {
    finishTurn(state);
    return;
  }
  state.burn = {
    rank: top.rank,
    closesAt: now + state.config.burnWindowMs,
    attempted: [],
  };
  state.phase = 'BURN_WINDOW';
}

function finishTurn(state: GameState): void {
  state.held = null;
  state.heldFromDiscard = false;
  state.power = null;
  state.burn = null;

  if (state.knockerId) {
    state.turnsSinceKnock += 1;
    if (state.turnsSinceKnock >= state.players.length - 1) {
      endRound(state);
      return;
    }
  }

  state.turn = (state.turn + 1) % state.players.length;
  state.phase = 'TURN_START';
}

function endRound(state: GameState, ashOutId: string | null = null): void {
  const totals: Record<string, number> = {};
  for (const player of state.players) totals[player.id] = handTotal(player);

  const scored: Record<string, number> = {};
  const knockerId = state.knockerId;

  let lowest = Infinity;
  for (const player of state.players) lowest = Math.min(lowest, totals[player.id]);
  const knockSucceeded =
    knockerId != null &&
    totals[knockerId] === lowest &&
    state.players.every((p) => p.id === knockerId || totals[p.id] > totals[knockerId]);

  for (const player of state.players) {
    if (player.id === ashOutId) {
      scored[player.id] = 0;
    } else if (player.id === knockerId) {
      scored[player.id] = knockSucceeded ? 0 : totals[player.id] + state.config.knockPenalty;
    } else {
      scored[player.id] = totals[player.id];
    }
  }

  let winnerId = state.players[0].id;
  if (ashOutId) {
    winnerId = ashOutId;
  } else {
    for (const player of state.players) {
      if (scored[player.id] < scored[winnerId]) winnerId = player.id;
    }
  }

  for (const player of state.players) player.matchScore += scored[player.id];

  const result: RoundResult = {
    totals,
    scored,
    knockerId,
    knockSucceeded,
    ashOutId,
    winnerId,
  };
  state.result = result;
  state.held = null;
  state.power = null;
  state.burn = null;
  state.reveals = [];

  if (knockerId) {
    const knocker = playerById(state, knockerId) as Player;
    log(
      state,
      knockSucceeded ? 'good' : 'bad',
      knockSucceeded ? 'knock_stuck' : 'knock_missed',
      { name: knocker.name, actorId: knocker.id, count: state.config.knockPenalty },
    );
  }

  const busted = state.players.filter((p) => p.matchScore >= state.config.targetScore);
  if (busted.length > 0) {
    let best = state.players[0];
    for (const player of state.players) {
      if (player.matchScore < best.matchScore) best = player;
    }
    state.matchWinnerId = best.id;
    state.phase = 'MATCH_OVER';
  } else {
    state.phase = 'ROUND_OVER';
  }
}

function checkAshOut(state: GameState, playerId: string): boolean {
  const player = playerById(state, playerId);
  if (!player || cardsLeft(player) > 0) return false;
  log(state, 'hot', 'ash_out', { name: player.name, actorId: player.id });
  endRound(state, playerId);
  return true;
}

/* ------------------------------------------------------------------ */
/* powers                                                              */
/* ------------------------------------------------------------------ */

function powerNeedsMore(state: GameState): boolean {
  const power = state.power;
  if (!power) return false;
  switch (power.kind) {
    case 'PEEK':
    case 'SPY':
    case 'EMBER':
      return power.picked.length < 1;
    case 'SWAP':
      return power.picked.length < 2;
    case 'LOOK_SWAP':
      return power.picked.length < 2;
    default:
      return false;
  }
}

function resolvePower(state: GameState, now: number): void {
  const power = state.power;
  if (!power) return;
  const actor = currentPlayer(state);

  if (power.kind === 'SWAP' && power.picked.length === 2) {
    const [mine, theirs] = power.picked;
    const me = playerById(state, mine.playerId) as Player;
    const them = playerById(state, theirs.playerId) as Player;
    const tmp = me.slots[mine.slot];
    me.slots[mine.slot] = them.slots[theirs.slot];
    them.slots[theirs.slot] = tmp;
    log(state, 'hot', 'blind_swap', { name: actor.name, actorId: actor.id, other: them.name, otherId: them.id });
  }

  if (power.kind === 'LOOK_SWAP' && power.picked.length === 2) {
    const [theirs, mine] = power.picked;
    const them = playerById(state, theirs.playerId) as Player;
    const me = playerById(state, mine.playerId) as Player;
    const tmp = me.slots[mine.slot];
    me.slots[mine.slot] = them.slots[theirs.slot];
    them.slots[theirs.slot] = tmp;
    log(state, 'hot', 'look_swap_took', { name: actor.name, actorId: actor.id, other: them.name, otherId: them.id });
  }

  state.power = null;
  openBurnWindow(state, now);
}

/* ------------------------------------------------------------------ */
/* the reducer                                                         */
/* ------------------------------------------------------------------ */

export function reduce(previous: GameState, action: GameAction, now = Date.now()): GameState {
  const state = clone(previous);

  switch (action.type) {
    /* -------------------------------------------------- opening peek */
    case 'OPENING_PEEK': {
      if (state.phase !== 'OPENING_PEEK') return previous;
      const left = state.openingPeeksLeft[action.playerId] ?? 0;
      if (left <= 0) return previous;
      const player = playerById(state, action.playerId);
      if (!player || !player.slots[action.slot]) return previous;

      const mine = state.reveals.find((reveal) => reveal.viewerId === action.playerId);
      const already = mine?.targets ?? [];
      if (already.some((t) => t.playerId === action.playerId && t.slot === action.slot)) {
        return previous;
      }

      state.openingPeeksLeft[action.playerId] = left - 1;
      setReveal(state, {
        viewerId: action.playerId,
        reason: 'opening',
        targets: [...already, { playerId: action.playerId, slot: action.slot }],
      });
      return state;
    }

    /* ------------------------------------------------------- reveals */
    case 'ACK_REVEAL': {
      const done = dropReveal(state, action.playerId);
      if (!done) return previous;

      if (done.reason === 'opening') {
        // Play starts once everyone has taken their look and put it away.
        const stillChoosing = Object.values(state.openingPeeksLeft).some((n) => n > 0);
        const stillLooking = state.reveals.some((reveal) => reveal.reason === 'opening');
        if (!stillChoosing && !stillLooking) {
          state.phase = 'TURN_START';
          // Kept neutral: at an online table this line is read by everyone.
          log(state, 'info', 'round_begins', { count: state.round });
        }
        return state;
      }

      if (done.reason === 'failed_burn') {
        // The window keeps running; other players may still burn.
        state.phase = state.burn ? 'BURN_WINDOW' : state.phase;
        return state;
      }

      // A peek, a spy, or the look half of a black king. Only the player
      // taking the turn can have one of these open.
      if (state.power && powerNeedsMore(state)) {
        state.phase = 'POWER';
        return state;
      }
      resolvePower(state, now);
      return state;
    }

    /* ---------------------------------------------------------- knock */
    case 'KNOCK': {
      if (state.phase !== 'TURN_START' || state.knockerId) return previous;
      const player = currentPlayer(state);
      state.knockerId = player.id;
      log(state, 'hot', 'knocked', { name: player.name, actorId: player.id });
      finishTurn(state);
      state.turnsSinceKnock = 0;
      return state;
    }

    /* ----------------------------------------------------------- draw */
    case 'DRAW_STOCK': {
      if (state.phase !== 'TURN_START') return previous;
      const card = drawCard(state);
      if (!card) {
        endRound(state);
        return state;
      }
      state.held = card;
      state.heldFromDiscard = false;
      state.phase = 'HOLDING';
      return state;
    }

    case 'DRAW_DISCARD': {
      if (state.phase !== 'TURN_START') return previous;
      const card = state.discard.pop();
      if (!card) return previous;
      state.held = card;
      state.heldFromDiscard = true;
      state.phase = 'HOLDING';
      log(state, 'info', 'took_discard', { name: currentPlayer(state).name, actorId: currentPlayer(state).id, card: ref(card) });
      return state;
    }

    /* -------------------------------------------------- place / throw */
    case 'PLACE': {
      if (state.phase !== 'HOLDING' || !state.held) return previous;
      const player = currentPlayer(state);
      const replaced = player.slots[action.slot];
      if (!replaced) return previous; // burned slots stay empty

      player.slots[action.slot] = state.held;
      state.discard.push(replaced);
      log(state, 'info', 'swapped_threw', { name: player.name, actorId: player.id, card: ref(replaced) });
      state.held = null;
      state.heldFromDiscard = false;
      openBurnWindow(state, now);
      return state;
    }

    case 'THROW': {
      if (state.phase !== 'HOLDING' || !state.held) return previous;
      if (state.heldFromDiscard) return previous; // a taken card must be kept
      const player = currentPlayer(state);
      const card = state.held;
      state.discard.push(card);
      state.held = null;

      if (action.usePower && card.power) {
        log(state, 'hot', 'threw_power', { name: player.name, actorId: player.id, card: ref(card), power: card.power });
        state.power = { kind: card.power, picked: [] };
        state.phase = 'POWER';
        return state;
      }

      log(state, 'info', 'threw', { name: player.name, actorId: player.id, card: ref(card) });
      openBurnWindow(state, now);
      return state;
    }

    /* --------------------------------------------------------- powers */
    case 'POWER_TARGET': {
      if (state.phase !== 'POWER' || !state.power) return previous;
      const actor = currentPlayer(state);
      const target = playerById(state, action.playerId);
      if (!target) return previous;

      const power = state.power;
      const step = power.picked.length;
      const isOwn = action.playerId === actor.id;

      if (power.kind === 'PEEK' && !isOwn) return previous;
      if ((power.kind === 'SPY' || power.kind === 'EMBER') && isOwn) return previous;
      if (power.kind === 'SWAP') {
        if (step === 0 && !isOwn) return previous;
        if (step === 1 && isOwn) return previous;
      }
      if (power.kind === 'LOOK_SWAP') {
        if (step === 0 && isOwn) return previous;
        if (step === 1 && !isOwn) return previous;
      }

      if (power.kind === 'EMBER') {
        const card = drawCard(state);
        if (!card) {
          state.power = null;
          openBurnWindow(state, now);
          return state;
        }
        target.slots.push(card);
        log(state, 'hot', 'ember', { name: actor.name, actorId: actor.id, other: target.name, otherId: target.id });
        state.power = null;
        openBurnWindow(state, now);
        return state;
      }

      if (!target.slots[action.slot]) return previous;
      power.picked.push({ playerId: action.playerId, slot: action.slot });

      if (power.kind === 'PEEK' || power.kind === 'SPY' || (power.kind === 'LOOK_SWAP' && step === 0)) {
        setReveal(state, {
          viewerId: actor.id,
          reason: power.kind === 'PEEK' ? 'peek' : power.kind === 'SPY' ? 'spy' : 'look_swap',
          targets: [{ playerId: action.playerId, slot: action.slot }],
        });
        if (power.kind !== 'LOOK_SWAP') {
          log(state, 'info', 'looked', { name: actor.name, actorId: actor.id });
        }
        return state;
      }

      if (powerNeedsMore(state)) return state;
      resolvePower(state, now);
      return state;
    }

    case 'POWER_DECLINE': {
      if (state.phase !== 'POWER' || !state.power) return previous;
      // Only the second half of a black king can be waved off.
      if (state.power.kind === 'LOOK_SWAP' && state.power.picked.length === 1) {
        log(state, 'info', 'look_swap_left', { name: currentPlayer(state).name, actorId: currentPlayer(state).id });
        state.power = null;
        openBurnWindow(state, now);
        return state;
      }
      return previous;
    }

    /* ----------------------------------------------------------- burn */
    case 'BURN': {
      if (state.phase !== 'BURN_WINDOW' || !state.burn) return previous;
      if (state.burn.attempted.includes(action.playerId)) return previous;
      const burner = playerById(state, action.playerId);
      const owner = playerById(state, action.ownerId);
      if (!burner || !owner) return previous;
      const card = owner.slots[action.slot];
      if (!card) return previous;

      // One go each per window, whosever card you reach for.
      state.burn.attempted.push(action.playerId);
      const mine = burner.id === owner.id;

      if (card.rank === state.burn.rank) {
        state.discard.push(card);

        if (mine) {
          // Your own card leaves the table for good: one card lighter.
          owner.slots[action.slot] = null;
          log(state, 'good', 'burned', {
            name: burner.name,
            actorId: burner.id,
            card: ref(card),
          });
          if (checkAshOut(state, owner.id)) return state;
          return state;
        }

        // Somebody else's card is replaced from the stock, face down. They
        // keep the same number of cards and lose the one thing that mattered
        // about that slot — knowing what was in it.
        const replacement = drawCard(state);
        owner.slots[action.slot] = replacement ?? null;
        log(state, 'hot', 'burned_theirs', {
          name: burner.name,
          actorId: burner.id,
          other: owner.name,
          otherId: owner.id,
          card: ref(card),
        });
        return state;
      }

      // A wrong guess turns the card over for the whole table to see — the
      // information is the price of grabbing at it — and costs the person who
      // grabbed, never the person whose card it was.
      log(state, 'bad', mine ? 'misfire' : 'misfire_theirs', {
        name: burner.name,
        actorId: burner.id,
        other: mine ? undefined : owner.name,
        otherId: mine ? undefined : owner.id,
        card: ref(card),
      });
      setReveal(state, {
        viewerId: '*',
        reason: 'failed_burn',
        targets: [{ playerId: action.ownerId, slot: action.slot }],
      });
      const penalty = drawCard(state);
      if (penalty) burner.slots.push(penalty);
      return state;
    }

    case 'CLOSE_BURN': {
      if (state.phase !== 'BURN_WINDOW') return previous;
      if (publicReveal(state)) return previous; // a misfire is still on show
      finishTurn(state);
      return state;
    }

    /* ----------------------------------------------------- next round */
    case 'NEXT_ROUND': {
      if (state.phase !== 'ROUND_OVER') return previous;
      return dealRound(state);
    }

    default:
      return previous;
  }
}

/** True when the burn window has run out of time. */
export function burnExpired(state: GameState, now: number): boolean {
  return state.phase === 'BURN_WINDOW' && !!state.burn && now >= state.burn.closesAt;
}

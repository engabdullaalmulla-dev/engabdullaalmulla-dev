/**
 * The bots. They remember what they have seen, forget some of it if they are
 * not very good, and otherwise play the same game you do — they cannot read
 * face-down cards they were never shown.
 */

import { cardsLeft, currentPlayer, handTotal, playerById, topDiscard } from './engine';
import type { Difficulty, GameAction, GameState, Player, Rank } from './types';

export interface MemoryEntry {
  cardId: string;
  rank: Rank;
  value: number;
}

/** Keyed `${playerId}:${slotIndex}`. */
export type BotMemory = Record<string, MemoryEntry>;

/** Average value of a card in the 108-card deck, used for unknown slots. */
export const UNKNOWN_VALUE = 6.8;

interface Traits {
  /** Chance of remembering something seen, per observation. */
  recall: number;
  /** Chance of acting on a burn the bot can see. */
  burnNerve: number;
  /** Highest estimated pile the bot will knock on. */
  knockAt: number;
  /** Extra points a swap must save before the bot bothers. */
  patience: number;
}

const TRAITS: Record<Difficulty, Traits> = {
  easy: { recall: 0.55, burnNerve: 0.3, knockAt: 13, patience: 3 },
  normal: { recall: 0.85, burnNerve: 0.7, knockAt: 10, patience: 2 },
  sharp: { recall: 1, burnNerve: 0.95, knockAt: 8, patience: 1 },
};

export function traitsFor(difficulty: Difficulty): Traits {
  return TRAITS[difficulty];
}

const key = (playerId: string, slot: number) => `${playerId}:${slot}`;

/* ------------------------------------------------------------------ */
/* memory                                                             */
/* ------------------------------------------------------------------ */

/** Bots memorise their two nearest cards during the opening peek. */
export function seedMemory(state: GameState, botId: string): BotMemory {
  const memory: BotMemory = {};
  const bot = playerById(state, botId);
  if (!bot) return memory;
  for (let slot = 0; slot < Math.min(state.config.openingPeeks, bot.slots.length); slot++) {
    const card = bot.slots[slot];
    if (card) memory[key(botId, slot)] = { cardId: card.id, rank: card.rank, value: card.value };
  }
  return memory;
}

function remember(
  memory: BotMemory,
  playerId: string,
  slot: number,
  card: { id: string; rank: Rank; value: number },
  recall: number,
  random: () => number,
): void {
  if (random() > recall) return; // it went in one ear and out the other
  memory[key(playerId, slot)] = { cardId: card.id, rank: card.rank, value: card.value };
}

/**
 * Folds one state transition into a bot's memory: drops anything that is no
 * longer where it was, and picks up whatever was public or shown to this bot.
 */
export function observeTransition(
  memory: BotMemory,
  previous: GameState,
  next: GameState,
  botId: string,
  random: () => number = Math.random,
): BotMemory {
  const bot = playerById(next, botId);
  const recall = bot ? traitsFor(bot.difficulty).recall : 1;
  const updated: BotMemory = { ...memory };

  // Anything shown face-up to everyone, or to this bot in particular.
  for (const reveal of next.reveals) {
    if (reveal.viewerId !== botId && reveal.viewerId !== '*') continue;
    for (const target of reveal.targets) {
      const player = playerById(next, target.playerId);
      const card = player?.slots[target.slot];
      if (card) {
        // A card you are staring at is remembered; forgetting comes later.
        updated[key(target.playerId, target.slot)] = {
          cardId: card.id,
          rank: card.rank,
          value: card.value,
        };
      }
    }
  }

  // A card taken off the discard pile is public: everyone sees where it lands.
  if (previous.held && previous.heldFromDiscard) {
    for (const player of next.players) {
      player.slots.forEach((card, slot) => {
        if (card && card.id === previous.held?.id) {
          remember(updated, player.id, slot, card, recall, random);
        }
      });
    }
  }

  // Forget anything that has moved, been burned, or been covered over.
  for (const entry of Object.keys(updated)) {
    const [playerId, slotText] = entry.split(':');
    const player = playerById(next, playerId);
    const card = player?.slots[Number(slotText)];
    if (!card || card.id !== updated[entry].cardId) delete updated[entry];
  }

  return updated;
}

/* ------------------------------------------------------------------ */
/* reading a hand                                                     */
/* ------------------------------------------------------------------ */

interface SlotView {
  slot: number;
  known: boolean;
  value: number;
}

function readHand(memory: BotMemory, player: Player): SlotView[] {
  const views: SlotView[] = [];
  player.slots.forEach((card, slot) => {
    if (!card) return;
    const seen = memory[key(player.id, slot)];
    views.push({ slot, known: !!seen, value: seen ? seen.value : UNKNOWN_VALUE });
  });
  return views;
}

/** What the bot thinks its pile is worth right now. */
export function estimateTotal(memory: BotMemory, player: Player): number {
  return readHand(memory, player).reduce((sum, view) => sum + view.value, 0);
}

function worstSlot(views: SlotView[]): SlotView | null {
  if (views.length === 0) return null;
  return views.reduce((worst, view) => (view.value > worst.value ? view : worst), views[0]);
}

function bestSlot(views: SlotView[]): SlotView | null {
  if (views.length === 0) return null;
  return views.reduce((best, view) => (view.value < best.value ? view : best), views[0]);
}

function unknownSlots(views: SlotView[]): SlotView[] {
  return views.filter((view) => !view.known);
}

function rivals(state: GameState, botId: string): Player[] {
  return state.players.filter((player) => player.id !== botId);
}

/** The rival the bot most wants to hurt: the one closest to winning. */
function leader(state: GameState, memory: BotMemory, botId: string): Player {
  const others = rivals(state, botId);
  return others.reduce((best, player) => {
    const bestScore = best.matchScore + estimateTotal(memory, best);
    const score = player.matchScore + estimateTotal(memory, player);
    return score < bestScore ? player : best;
  }, others[0]);
}

/* ------------------------------------------------------------------ */
/* decisions                                                          */
/* ------------------------------------------------------------------ */

/** The bot's move for whatever the game is currently waiting on. */
export function decide(state: GameState, botId: string, memory: BotMemory): GameAction | null {
  const bot = playerById(state, botId);
  if (!bot) return null;
  const traits = traitsFor(bot.difficulty);
  const views = readHand(memory, bot);

  switch (state.phase) {
    case 'TURN_START':
      return decideTurnStart(state, bot, memory, traits, views);
    case 'HOLDING':
      return decideHolding(state, bot, traits, views);
    case 'POWER':
      return decidePower(state, bot, memory, views);
    default:
      return null;
  }
}

function decideTurnStart(
  state: GameState,
  bot: Player,
  memory: BotMemory,
  traits: Traits,
  views: SlotView[],
): GameAction {
  const estimate = estimateTotal(memory, bot);
  const knownCount = views.filter((view) => view.known).length;
  const confident = knownCount >= Math.max(2, views.length - 1);

  if (!state.knockerId && confident && estimate <= traits.knockAt) {
    return { type: 'KNOCK' };
  }
  // A pile that is nearly burned away is worth ending on.
  if (!state.knockerId && cardsLeft(bot) <= 2 && estimate <= traits.knockAt + 3) {
    return { type: 'KNOCK' };
  }

  const top = topDiscard(state);
  if (top) {
    const worst = worstSlot(views);
    const gain = worst ? worst.value - top.value : 0;
    if (gain >= traits.patience + 1 && top.value <= 6) {
      return { type: 'DRAW_DISCARD' };
    }
  }
  return { type: 'DRAW_STOCK' };
}

function decideHolding(
  state: GameState,
  bot: Player,
  traits: Traits,
  views: SlotView[],
): GameAction {
  const card = state.held;
  if (!card) return { type: 'DRAW_STOCK' };

  const worst = worstSlot(views);
  const blind = unknownSlots(views);
  const target = worst ?? blind[0] ?? views[0];

  if (state.heldFromDiscard) {
    return { type: 'PLACE', slot: target ? target.slot : 0 };
  }

  const gain = target ? target.value - card.value : 0;

  // Information is only worth having when the swap barely pays.
  if (card.power && gain < traits.patience + 2) {
    return { type: 'THROW', usePower: true };
  }
  if (target && gain > 0) {
    return { type: 'PLACE', slot: target.slot };
  }
  return { type: 'THROW', usePower: !!card.power };
}

function decidePower(
  state: GameState,
  bot: Player,
  memory: BotMemory,
  views: SlotView[],
): GameAction | null {
  const power = state.power;
  if (!power) return null;
  const step = power.picked.length;

  switch (power.kind) {
    case 'PEEK': {
      const blind = unknownSlots(views);
      const target = blind[0] ?? views[0];
      if (!target) return null;
      return { type: 'POWER_TARGET', playerId: bot.id, slot: target.slot };
    }

    case 'SPY': {
      const mark = leader(state, memory, bot.id);
      const theirViews = readHand(memory, mark);
      const blind = unknownSlots(theirViews);
      const target = blind[0] ?? theirViews[0];
      if (!target) return null;
      return { type: 'POWER_TARGET', playerId: mark.id, slot: target.slot };
    }

    case 'EMBER': {
      const mark = leader(state, memory, bot.id);
      return { type: 'POWER_TARGET', playerId: mark.id, slot: 0 };
    }

    case 'SWAP': {
      if (step === 0) {
        const worst = worstSlot(views);
        if (!worst) return null;
        return { type: 'POWER_TARGET', playerId: bot.id, slot: worst.slot };
      }
      const mark = leader(state, memory, bot.id);
      const theirViews = readHand(memory, mark);
      // Take what you know is good; otherwise take a chance on a hidden card.
      const known = theirViews.filter((view) => view.known);
      const target = (known.length ? bestSlot(known) : null) ?? unknownSlots(theirViews)[0] ?? theirViews[0];
      if (!target) return null;
      return { type: 'POWER_TARGET', playerId: mark.id, slot: target.slot };
    }

    case 'LOOK_SWAP': {
      if (step === 0) {
        const mark = leader(state, memory, bot.id);
        const theirViews = readHand(memory, mark);
        const target = unknownSlots(theirViews)[0] ?? theirViews[0];
        if (!target) return null;
        return { type: 'POWER_TARGET', playerId: mark.id, slot: target.slot };
      }
      // The card has been looked at, so the bot now knows what it is worth.
      const looked = power.picked[0];
      const seen = memory[key(looked.playerId, looked.slot)];
      const worst = worstSlot(views);
      const traits = traitsFor(bot.difficulty);
      if (seen && worst && worst.value - seen.value >= traits.patience) {
        return { type: 'POWER_TARGET', playerId: bot.id, slot: worst.slot };
      }
      return { type: 'POWER_DECLINE' };
    }

    default:
      return null;
  }
}

/** Whether this bot spots a burn, and whose card it reaches for. */
export function decideBurn(
  state: GameState,
  botId: string,
  memory: BotMemory,
  random: () => number = Math.random,
): GameAction | null {
  if (state.phase !== 'BURN_WINDOW' || !state.burn) return null;
  if (state.burn.attempted.includes(botId)) return null;
  const bot = playerById(state, botId);
  if (!bot) return null;
  const traits = traitsFor(bot.difficulty);

  /** Somewhere this bot remembers a card of the rank on the pile. */
  const match = (player: Player): number | null => {
    for (let slot = 0; slot < player.slots.length; slot++) {
      const card = player.slots[slot];
      const seen = memory[key(player.id, slot)];
      if (card && seen && seen.rank === state.burn!.rank) return slot;
    }
    return null;
  };

  // Your own is always worth burning: the card leaves the table and nothing
  // takes its place, so the pile simply gets smaller.
  const own = match(bot);
  if (own != null) {
    if (random() > traits.burnNerve) return null;
    return { type: 'BURN', playerId: botId, ownerId: botId, slot: own };
  }

  // A rival's card is replaced from the stock rather than removed, so burning
  // their Joker would be doing them a favour. Only a cheap card of theirs is
  // worth taking away — what they get back averages UNKNOWN_VALUE, and they
  // will not know what it is.
  for (const rival of state.players) {
    if (rival.id === botId) continue;
    const slot = match(rival);
    if (slot == null) continue;
    const seen = memory[key(rival.id, slot)];
    if (!seen || seen.value >= UNKNOWN_VALUE - 1) continue;
    if (random() > traits.burnNerve) return null;
    return { type: 'BURN', playerId: botId, ownerId: rival.id, slot };
  }

  return null;
}

/**
 * How long a bot appears to think. Long enough to read as a decision, short
 * enough that three bots in a row do not feel like a queue.
 */
export function thinkingTime(state: GameState, difficulty: Difficulty): number {
  const base = state.phase === 'POWER' ? 380 : 520;
  const jitter = difficulty === 'sharp' ? 180 : 320;
  return base + Math.random() * jitter;
}

export { currentPlayer, handTotal };

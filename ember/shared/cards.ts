import { shuffle } from './rng';
import type { Card, Power, Rank, Suit } from './types';

export const SUITS: Suit[] = ['S', 'H', 'D', 'C'];
export const RED_SUITS: Suit[] = ['H', 'D'];

export const SUIT_SYMBOL: Record<Suit, string> = {
  S: '♠',
  H: '♥',
  D: '♦',
  C: '♣',
};

export const RANKS: Rank[] = [
  'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K',
];

export function isRed(suit: Suit | null): boolean {
  return suit === 'H' || suit === 'D';
}

/**
 * Point values. A red king is the prize of the game at zero; a joker is the
 * thing you most want out of your pile at fifteen.
 */
export function valueOf(rank: Rank, suit: Suit | null): number {
  if (rank === 'JOKER') return 15;
  if (rank === 'K') return isRed(suit) ? 0 : 13;
  if (rank === 'A') return 1;
  if (rank === 'J') return 11;
  if (rank === 'Q') return 12;
  return parseInt(rank, 10);
}

/** Powers fire only when a card is thrown away, never when it is kept. */
export function powerOf(rank: Rank, suit: Suit | null): Power | null {
  switch (rank) {
    case '7':
    case '8':
      return 'PEEK';
    case '9':
    case '10':
      return 'SPY';
    case 'J':
    case 'Q':
      return 'SWAP';
    case 'K':
      // A red king is worth nothing at all, so it carries no power to spend.
      return isRed(suit) ? null : 'LOOK_SWAP';
    case 'JOKER':
      return 'EMBER';
    default:
      return null;
  }
}

export const POWER_LABEL: Record<Power, string> = {
  PEEK: 'Peek',
  SPY: 'Spy',
  SWAP: 'Swap',
  LOOK_SWAP: 'Look & Swap',
  EMBER: 'Ember',
};

export const POWER_HINT: Record<Power, string> = {
  PEEK: 'Look at one of your own cards.',
  SPY: "Look at one of a rival's cards.",
  SWAP: "Trade one of yours for one of theirs, sight unseen.",
  LOOK_SWAP: "Look at a rival's card, then take it if you want it.",
  EMBER: 'Force a rival to take a card from the stock.',
};

export function makeCard(rank: Rank, suit: Suit | null, copy: number): Card {
  return {
    id: `${rank}${suit ?? 'X'}-${copy}`,
    rank,
    suit,
    value: valueOf(rank, suit),
    power: powerOf(rank, suit),
  };
}

/** Two full decks plus their jokers: 108 cards, same as the box. */
export function buildDeck(): Card[] {
  const cards: Card[] = [];
  for (let copy = 1; copy <= 2; copy++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        cards.push(makeCard(rank, suit, copy));
      }
    }
    cards.push(makeCard('JOKER', null, copy * 2 - 1));
    cards.push(makeCard('JOKER', null, copy * 2));
  }
  return cards;
}

export function buildShuffledDeck(seed: number): { cards: Card[]; seed: number } {
  const result = shuffle(buildDeck(), seed);
  return { cards: result.items, seed: result.seed };
}

export function cardLabel(card: Card): string {
  if (card.rank === 'JOKER') return 'Joker';
  return `${card.rank}${SUIT_SYMBOL[card.suit as Suit]}`;
}

/** "an 8", "a Queen", "a Joker" — for prompts that read as a sentence. */
export function spokenRank(rank: Rank): string {
  const spoken: Partial<Record<Rank, string>> = {
    A: 'an Ace',
    '8': 'an 8',
    J: 'a Jack',
    Q: 'a Queen',
    K: 'a King',
    JOKER: 'a Joker',
  };
  return spoken[rank] ?? `a ${rank}`;
}

export function cardName(card: Card): string {
  if (card.rank === 'JOKER') return 'a Joker';
  if (card.rank === 'K') return isRed(card.suit) ? 'a red King' : 'a black King';
  return `the ${card.rank}${SUIT_SYMBOL[card.suit as Suit]}`;
}

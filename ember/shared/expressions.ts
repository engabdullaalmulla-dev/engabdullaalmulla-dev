/**
 * What one player is allowed to say to another.
 *
 * There is no free text anywhere in EMBER, and there is not going to be: a
 * table of four strangers needs no moderation queue. What crosses the wire is
 * an id out of this list, and each phone draws it in its own language — so an
 * Arabic player and an English player can sit at the same table and both be
 * understood without either of them reading the other's alphabet.
 */

export const EMOJI = [
  { id: 'laugh', glyph: '😂' },
  { id: 'cry', glyph: '😭' },
  { id: 'wow', glyph: '😮' },
  { id: 'think', glyph: '🤔' },
  { id: 'cool', glyph: '😎' },
  { id: 'fire', glyph: '🔥' },
  { id: 'clap', glyph: '👏' },
  { id: 'heart', glyph: '❤️' },
  { id: 'skull', glyph: '💀' },
  { id: 'clown', glyph: '🤡' },
  { id: 'eyes', glyph: '👀' },
  { id: 'brain', glyph: '🧠' },
  { id: 'sleep', glyph: '😴' },
  { id: 'salute', glyph: '🫡' },
  { id: 'goat', glyph: '🐐' },
] as const;

/**
 * The lines, in two halves: the ones you send when you mean them, and the ones
 * you send to wind somebody up. Both are meant to be read as a joke, which is
 * why there is no way to write your own.
 */
export const KIND_PHRASES = [
  'hello',
  'nice',
  'wellPlayed',
  'goodGame',
  'lucky',
  'close',
  'oops',
  'thanks',
] as const;

export const CHEEKY_PHRASES = [
  'yourTurn',
  'sleeping',
  'teaTime',
  'memory',
  'forgot',
  'didntSee',
  'notThatLucky',
  'watchThis',
] as const;

export const PHRASES = [...KIND_PHRASES, ...CHEEKY_PHRASES] as const;

export type EmojiId = (typeof EMOJI)[number]['id'];
export type KindPhraseId = (typeof KIND_PHRASES)[number];
export type CheekyPhraseId = (typeof CHEEKY_PHRASES)[number];
export type PhraseId = KindPhraseId | CheekyPhraseId;
export type ExpressionId = EmojiId | PhraseId;

export interface Expression {
  id: ExpressionId;
  kind: 'emoji' | 'phrase';
  /** Drawn for an emoji. A phrase draws its words instead. */
  glyph?: string;
}

export const EXPRESSIONS: Expression[] = [
  ...EMOJI.map((entry) => ({ id: entry.id as ExpressionId, kind: 'emoji' as const, glyph: entry.glyph })),
  ...PHRASES.map((id) => ({ id: id as ExpressionId, kind: 'phrase' as const })),
];

const BY_ID = new Map(EXPRESSIONS.map((entry) => [entry.id, entry]));

export function expression(id: string): Expression | null {
  return BY_ID.get(id as ExpressionId) ?? null;
}

export function isExpressionId(value: unknown): value is ExpressionId {
  return typeof value === 'string' && BY_ID.has(value as ExpressionId);
}

/** An emoji can be thrown at somebody. A phrase is said to the table. */
export function canAim(id: ExpressionId): boolean {
  return expression(id)?.kind === 'emoji';
}

/**
 * How often anyone may say anything.
 *
 * Generous enough that a burst of laughter after a good burn goes through,
 * tight enough that nobody can paper the table with it.
 */
export const EXPRESSION_LIMIT = { perWindow: 5, windowMs: 12_000, gapMs: 900 } as const;

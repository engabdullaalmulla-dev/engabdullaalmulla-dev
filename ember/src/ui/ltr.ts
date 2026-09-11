import { Platform } from 'react-native';
import type { ViewStyle } from 'react-native';

/**
 * Pinning which way round something is laid out.
 *
 * Two platforms, two mechanisms. React Native reads `direction` from a style
 * (and `writingDirection` on text, which is a different property). The web
 * reads the `dir` attribute and rejects `direction` as a style outright — so
 * the style half is left off there rather than warning on every render.
 *
 * Most of the app follows the language. A few things must not: the wordmark,
 * the faces of the cards, a room code read out character by character, card
 * notation like "2 – 10" that bidi would otherwise be free to reorder.
 */

type DirProp = { dir?: 'ltr' | 'rtl' };

export const LTR = { dir: 'ltr' } as unknown as DirProp;
export const RTL = { dir: 'rtl' } as unknown as DirProp;

export const asDir = (rtl: boolean): DirProp => (rtl ? RTL : LTR);

/** The style half of the same thing. Null on the web, where `dir` does it. */
export function directionStyle(dir: 'ltr' | 'rtl'): ViewStyle | null {
  return Platform.OS === 'web' ? null : { direction: dir };
}

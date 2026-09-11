import { Platform } from 'react-native';

/**
 * EMBER's look: the game as it sits on a kitchen table in the afternoon.
 *
 * Warm paper underneath, white cards on top, and one coral accent — the ember
 * the game is named for — spent only on the thing you are meant to do next.
 * Everything else is ink and a little sage. Nothing here is loud; the loudest
 * moment in the game is a card catching light, and even that is a glow rather
 * than an alarm.
 */

export const colors = {
  /** The table itself, from the bright middle out to the shaded edge. */
  paperLight: '#FFFAF2',
  paper: '#F6EEE4',
  paperShade: '#EDE2D4',
  paperEdge: '#E0D2C0',

  /** Panels laid on the paper. */
  surface: '#FFFDF9',
  surfaceRaised: '#FFFFFF',
  line: '#E6DACA',
  hairline: '#CFBFA9',

  /** The ember: what to do next, and what is alight. */
  coral: '#E8734A',
  coralSoft: '#F3A184',
  coralDeep: '#C1512B',
  /** A breath of coral, for a button that should be noticed but not obeyed. */
  coralWash: '#FBE7DD',

  /** Ink. Navy rather than black, which is softer to read on cream. */
  text: '#23374F',
  textMuted: '#66788D',
  textFaint: '#9BA8B7',

  /** A quiet second colour, for things that are simply true. */
  sage: '#8FB09B',
  sageDeep: '#5E8874',

  /** Cards. */
  cream: '#FFFFFF',
  creamEdge: '#E9E0D3',
  creamShade: '#FAF5ED',
  ink: '#2B2723',
  inkSoft: '#8A7F73',
  suitRed: '#D0453C',
  suitBlack: '#2B2723',
  /** The ground of a card back. */
  backInk: '#E8734A',

  good: '#5E8874',
  bad: '#D0453C',
} as const;

/**
 * A serif for the deck itself — the wordmark and the ranks on the cards, where
 * it belongs — and the platform's own interface face, at a friendly weight,
 * for everything the game says to you. Both are already on the device, so
 * nothing waits on a font and nothing falls back silently.
 */
export const fonts = {
  display: Platform.select({
    ios: 'Palatino',
    android: 'serif',
    default: 'Palatino, "Palatino Linotype", "Book Antiqua", Georgia, serif',
  }),
  sans: Platform.select({
    ios: undefined,
    android: undefined,
    default:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  }),
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 26,
  card: 0.09, // as a fraction of card width, so corners scale with the card
  pill: 999,
} as const;

export const space = (n: number) => n * 4;

export const type = {
  title: {
    fontFamily: fonts.display,
    fontSize: 42,
    fontWeight: '700' as const,
    letterSpacing: 4,
  },
  /** What the table says to you: friendly, not formal. */
  heading: {
    fontFamily: fonts.sans,
    fontSize: 21,
    fontWeight: '800' as const,
    letterSpacing: -0.2,
  },
  body: {
    fontFamily: fonts.sans,
    fontSize: 15,
    fontWeight: '500' as const,
  },
  label: {
    fontFamily: fonts.sans,
    fontSize: 11,
    fontWeight: '800' as const,
    letterSpacing: 1.2,
  },
  small: {
    fontFamily: fonts.sans,
    fontSize: 12,
    fontWeight: '600' as const,
  },
  numeral: {
    fontFamily: fonts.display,
    fontWeight: '700' as const,
  },
} as const;

/** Daylight shadows: warm, soft, and never heavy. */
export const shadow = {
  card: {
    shadowColor: '#8A6A4A',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  flying: {
    shadowColor: '#8A6A4A',
    shadowOpacity: 0.26,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 14 },
    elevation: 12,
  },
  /** Something waiting to be tapped. */
  lit: {
    shadowColor: colors.coral,
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
} as const;

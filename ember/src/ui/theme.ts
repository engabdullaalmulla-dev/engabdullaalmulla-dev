import { Platform } from 'react-native';

/**
 * EMBER's look: a card table. Baize under everything, a light hung over the
 * middle of it, cream cards with real corners, and gold where a good deck has
 * gilding. One bold accent — the ember the game is named for — spent only on
 * the thing you are meant to do next.
 */

export const colors = {
  /** The felt, from the lit centre out to the shadowed edge. */
  feltLit: '#24513F',
  felt: '#1B3A2F',
  feltDeep: '#122A22',
  feltEdge: '#0C1B16',

  /** Panels away from the table: darker baize with a leather cast. */
  panel: '#102A22E0',
  panelRaised: '#17392EF2',
  line: '#2C5647',
  hairline: '#3C6A58',

  /** Gilding. Structure, labels, the rim of things. */
  gold: '#C9A227',
  goldSoft: '#E0C874',
  goldFaint: '#6E5E2E',

  /** The ember: what you are meant to do next, and what is on fire. */
  ember: '#E8622F',
  emberSoft: '#F3915F',
  emberDeep: '#A8350F',

  /** Cards. */
  cream: '#FBF7EF',
  creamEdge: '#E6DCC9',
  creamShade: '#EFE7D8',
  ink: '#17120F',
  inkSoft: '#7A6A5C',
  suitRed: '#B3332C',
  suitBlack: '#1C1714',
  backInk: '#581A16',

  /** Type on the felt. Neutrals carry the green of the ground. */
  text: '#F1EADC',
  textMuted: '#A8BCAF',
  textFaint: '#6F887B',

  good: '#7BC49A',
  bad: '#E2564A',
} as const;

/**
 * A serif for anything that belongs to the deck — the wordmark, card ranks,
 * headings — and the platform's own interface face for everything else. Both
 * are already on the device, so nothing is ever waiting on a font to load and
 * nothing falls back silently.
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
  sm: 6,
  md: 12,
  lg: 20,
  card: 0.075, // as a fraction of card width, so corners scale with the card
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
  heading: {
    fontFamily: fonts.display,
    fontSize: 21,
    fontWeight: '700' as const,
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
    letterSpacing: 1.6,
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

export const shadow = {
  /** A card lying on the felt. */
  card: {
    shadowColor: '#03110C',
    shadowOpacity: 0.55,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  /** A card in the air, on its way somewhere. */
  flying: {
    shadowColor: '#03110C',
    shadowOpacity: 0.65,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 14 },
    elevation: 18,
  },
  /** Something waiting to be tapped. */
  lit: {
    shadowColor: colors.ember,
    shadowOpacity: 0.65,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
} as const;

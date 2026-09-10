/** EMBER's look: warm charcoal table, cream cards, a fire that never quite goes out. */

export const colors = {
  bg: '#14100E',
  bgDeep: '#0C0908',
  surface: '#1E1815',
  surfaceRaised: '#2A211C',
  line: '#3A2E27',

  ember: '#FF6B35',
  emberSoft: '#F4845F',
  gold: '#FFB627',

  cream: '#F7F1E8',
  cardEdge: '#E4D9C8',
  ink: '#191310',
  inkSoft: '#6B5B50',

  suitRed: '#C8443C',
  suitBlack: '#221B17',

  text: '#F2E9E1',
  textMuted: '#9B8A7E',
  textFaint: '#6A5A50',

  good: '#6FBF8B',
  bad: '#E0574A',
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 22,
  pill: 999,
} as const;

export const space = (n: number) => n * 4;

export const type = {
  title: {
    fontSize: 44,
    fontWeight: '800' as const,
    letterSpacing: 6,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  body: {
    fontSize: 15,
    fontWeight: '500' as const,
  },
  label: {
    fontSize: 12,
    fontWeight: '700' as const,
    letterSpacing: 1.4,
  },
  small: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
} as const;

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },
  lift: {
    shadowColor: colors.ember,
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
} as const;

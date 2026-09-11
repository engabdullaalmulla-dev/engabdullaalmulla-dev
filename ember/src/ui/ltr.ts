/**
 * Keeping Latin script the right way round inside an Arabic screen.
 *
 * A few things are not prose and must not mirror: the wordmark, a room code
 * read out character by character, card notation like "2 – 10", the faces of
 * the cards themselves. React Native honours `direction` in a style, but
 * react-native-web drops it from generated stylesheet classes, so the web also
 * needs the `dir` attribute. Spread this alongside a style that sets
 * `direction: 'ltr'` and both platforms are covered.
 */
export const LTR = { dir: 'ltr' } as unknown as { dir?: 'ltr' };

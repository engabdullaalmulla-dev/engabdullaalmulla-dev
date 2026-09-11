import * as Haptics from 'expo-haptics';

/**
 * Haptics are a nicety, not a feature — anything that throws (simulators, the
 * web) is swallowed on purpose.
 */
const safely = (run: () => Promise<unknown>) => {
  try {
    void run().catch?.(() => undefined);
  } catch {
    // ignore
  }
};

/** A light tick: picking something up, tapping a control. */
export const tap = () => safely(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));

/** A card landing. */
export const thud = () => safely(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));

/** A burn, a knock: the moments worth feeling. */
export const slam = () => safely(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));

/** A rigid click, for a card turning over. */
export const click = () => safely(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid));

export const win = () => safely(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
export const fail = () => safely(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));

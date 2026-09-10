import * as Haptics from 'expo-haptics';

/**
 * Haptics are a nicety, not a feature — anything that throws (simulators, web)
 * is swallowed on purpose.
 */
const safely = (run: () => Promise<unknown>) => {
  try {
    void run();
  } catch {
    // ignore
  }
};

export const tap = () => safely(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
export const thud = () => safely(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
export const slam = () => safely(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));
export const win = () => safely(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
export const fail = () => safely(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));

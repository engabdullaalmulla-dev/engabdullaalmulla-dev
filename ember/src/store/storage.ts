/**
 * Where small things are kept between sessions: the device keychain on a
 * phone, localStorage in a browser. Everything here fails quietly — a device
 * that will not remember something still plays the game.
 */

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export async function read(key: string): Promise<string | null> {
  try {
    if (Platform.OS === 'web') return globalThis.localStorage?.getItem(key) ?? null;
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

export async function write(key: string, value: string): Promise<void> {
  try {
    if (Platform.OS === 'web') globalThis.localStorage?.setItem(key, value);
    else await SecureStore.setItemAsync(key, value);
  } catch {
    // Not remembering is survivable; throwing here is not.
  }
}

export async function forget(key: string): Promise<void> {
  try {
    if (Platform.OS === 'web') globalThis.localStorage?.removeItem(key);
    else await SecureStore.deleteItemAsync(key);
  } catch {
    // Nothing useful to do.
  }
}

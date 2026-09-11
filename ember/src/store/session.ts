/**
 * Where the sign-in token is kept: the device keychain on a phone, and
 * localStorage in a browser, which is the best a browser offers.
 */

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import type { PublicUser } from '../../shared/protocol';

const KEY = 'ember.session';

export interface StoredSession {
  token: string;
  user: PublicUser;
}

const webStore = {
  get(key: string): string | null {
    try {
      return globalThis.localStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  },
  set(key: string, value: string): void {
    try {
      globalThis.localStorage?.setItem(key, value);
    } catch {
      // A browser with storage blocked simply will not remember the sign-in.
    }
  },
  remove(key: string): void {
    try {
      globalThis.localStorage?.removeItem(key);
    } catch {
      // As above.
    }
  },
};

export async function loadSession(): Promise<StoredSession | null> {
  try {
    const raw =
      Platform.OS === 'web' ? webStore.get(KEY) : await SecureStore.getItemAsync(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSession;
    return parsed?.token && parsed?.user?.id ? parsed : null;
  } catch {
    return null;
  }
}

export async function saveSession(session: StoredSession): Promise<void> {
  const raw = JSON.stringify(session);
  try {
    if (Platform.OS === 'web') webStore.set(KEY, raw);
    else await SecureStore.setItemAsync(KEY, raw);
  } catch {
    // Not being able to remember the sign-in is survivable; failing here is not.
  }
}

export async function clearSession(): Promise<void> {
  try {
    if (Platform.OS === 'web') webStore.remove(KEY);
    else await SecureStore.deleteItemAsync(KEY);
  } catch {
    // Nothing useful to do.
  }
}

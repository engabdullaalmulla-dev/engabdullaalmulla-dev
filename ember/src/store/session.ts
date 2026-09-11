/** Where the sign-in token is kept. */

import type { PublicUser } from '../../shared/protocol';
import { forget, read, write } from './storage';

const KEY = 'ember.session';

export interface StoredSession {
  token: string;
  user: PublicUser;
}

export async function loadSession(): Promise<StoredSession | null> {
  const raw = await read(KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredSession;
    return parsed?.token && parsed?.user?.id ? parsed : null;
  } catch {
    return null;
  }
}

export async function saveSession(session: StoredSession): Promise<void> {
  await write(KEY, JSON.stringify(session));
}

export async function clearSession(): Promise<void> {
  await forget(KEY);
}

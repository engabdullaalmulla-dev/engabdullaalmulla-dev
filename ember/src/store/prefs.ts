import type { LocaleCode } from '../i18n/strings';
import type { Difficulty } from '../../shared/types';
import { read, write } from './storage';

/** What the player has chosen, kept between sessions. */
export interface Prefs {
  locale?: LocaleCode;
  sound: boolean;
  assist: boolean;
  rivals: number;
  difficulty: Difficulty;
}

export const DEFAULT_PREFS: Prefs = {
  locale: undefined,
  sound: true,
  assist: false,
  rivals: 2,
  difficulty: 'normal',
};

const KEY = 'ember.prefs';

export async function loadPrefs(): Promise<Prefs> {
  const raw = await read(KEY);
  if (!raw) return { ...DEFAULT_PREFS };
  try {
    return { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<Prefs>) };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export async function savePrefs(prefs: Prefs): Promise<void> {
  await write(KEY, JSON.stringify(prefs));
}

import React, { createContext, useContext, useMemo } from 'react';

import type { LogEntry, Power, Rank, Suit } from '../../shared/types';
import { en, LOCALES, type LocaleCode, type Strings } from './strings';

/**
 * The language the app is speaking, and everything that depends on it —
 * including which way round the screen is laid out.
 */

export interface Language {
  t: Strings;
  locale: LocaleCode;
  rtl: boolean;
  setLocale: (locale: LocaleCode) => void;
  /** Numbers in this language's digits. */
  n: (value: number | string) => string;
  /** A recorded event, as a sentence. Pass your own id to be spoken to. */
  line: (entry: LogEntry, youId?: string) => string;
  power: (power: Power) => string;
  card: (ref: { rank: Rank; suit: Suit | null }) => string;
}

const LanguageContext = createContext<Language | null>(null);

/** The device's own language, when the player has not chosen one. */
export function deviceLocale(): LocaleCode {
  try {
    const tags: string[] = [];
    const browser = (globalThis as unknown as {
      navigator?: { languages?: readonly string[]; language?: string };
    }).navigator;
    if (browser?.languages) tags.push(...browser.languages);
    if (browser?.language) tags.push(browser.language);
    tags.push(Intl.DateTimeFormat().resolvedOptions().locale);
    return tags.some((tag) => tag?.toLowerCase().startsWith('ar')) ? 'ar' : 'en';
  } catch {
    return 'en';
  }
}

export function LanguageProvider({
  locale,
  setLocale,
  children,
}: {
  locale: LocaleCode;
  setLocale: (locale: LocaleCode) => void;
  children: React.ReactNode;
}) {
  const value = useMemo<Language>(() => {
    const t = LOCALES[locale] ?? en;
    const card = (ref: { rank: Rank; suit: Suit | null }) => t.cards.name(ref);
    const power = (which: Power) => t.powers[which].name;
    return {
      t,
      locale,
      rtl: t.rtl,
      setLocale,
      n: t.digits,
      card,
      power,
      line: (entry: LogEntry, youId?: string) =>
        t.log(entry, {
          card,
          power,
          you: !!youId && entry.actorId === youId,
          toYou: !!youId && entry.otherId === youId,
        }),
    };
  }, [locale, setLocale]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): Language {
  const value = useContext(LanguageContext);
  if (!value) throw new Error('useLanguage must be used inside a LanguageProvider');
  return value;
}

export type { LocaleCode, Strings };

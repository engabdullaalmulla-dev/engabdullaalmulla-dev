import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { Difficulty } from '../../../shared/types';
import { Button } from '../components/Button';
import { Toggle } from '../components/Toggle';
import { Wordmark } from '../components/Wordmark';
import { useLanguage } from '../../i18n';
import { tap } from '../haptics';
import { DIFFICULTIES } from '../labels';
import { colors, radius, space, type as typography } from '../theme';

export interface Settings {
  rivals: number;
  difficulty: Difficulty;
  assist: boolean;
  sound: boolean;
}

interface Props {
  settings: Settings;
  onChange: (settings: Settings) => void;
  onPlay: () => void;
  onPlayOnline: () => void;
  onRules: () => void;
  /** Shown when there is already a signed-in account on this device. */
  signedInAs?: string | null;
  /** False in a build with no server behind it. */
  onlineEnabled?: boolean;
}

export function HomeScreen({
  settings,
  onChange,
  onPlay,
  onPlayOnline,
  onRules,
  signedInAs,
  onlineEnabled = true,
}: Props) {
  const { t, n, locale, setLocale } = useLanguage();

  return (
    <ScrollView contentContainerStyle={styles.screen} showsVerticalScrollIndicator={false}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.home.language}
          onPress={() => {
            tap();
            setLocale(locale === 'ar' ? 'en' : 'ar');
          }}
          hitSlop={10}
          style={styles.language}
        >
          <Text style={styles.languageText}>{t.home.language}</Text>
        </Pressable>
      </View>

      <View style={styles.hero}>
        <Wordmark size={46} />
        <Text style={styles.tagline}>{t.home.tagline}</Text>
        <Text style={styles.blurb}>{t.home.blurb}</Text>
      </View>

      <View style={styles.actions}>
        {onlineEnabled ? (
          <>
            <Button label={t.home.playOnline} onPress={onPlayOnline} />
            <Text style={styles.online}>
              {signedInAs ? t.home.onlineSignedIn(signedInAs) : t.home.onlineBlurb}
            </Text>
          </>
        ) : (
          <Text style={styles.online}>{t.home.offlineOnly}</Text>
        )}
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>{t.home.againstBots}</Text>
        <Segment
          label={t.home.table}
          options={[
            { value: 2, label: t.home.players(n(3)) },
            { value: 3, label: t.home.players(n(4)) },
            { value: 4, label: t.home.players(n(5)) },
          ]}
          value={settings.rivals}
          onChange={(rivals) => onChange({ ...settings, rivals })}
        />

        <Segment
          label={t.home.opponents}
          options={DIFFICULTIES.map((value) => ({ value, label: t.difficulty[value] }))}
          value={settings.difficulty}
          onChange={(difficulty) => onChange({ ...settings, difficulty })}
        />

        <View style={styles.switchRow}>
          <View style={styles.switchText}>
            <Text style={styles.switchLabel}>{t.home.assist}</Text>
            <Text style={styles.switchHint}>{t.home.assistHint}</Text>
          </View>
          <Toggle
            label={t.home.assist}
            value={settings.assist}
            onValueChange={(assist) => onChange({ ...settings, assist })}
          />
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchText}>
            <Text style={styles.switchLabel}>{t.home.sound}</Text>
            <Text style={styles.switchHint}>{t.home.soundHint}</Text>
          </View>
          <Toggle
            label={t.home.sound}
            value={settings.sound}
            onValueChange={(sound) => onChange({ ...settings, sound })}
          />
        </View>

        <Button label={t.home.deal} tone="ghost" onPress={onPlay} />
      </View>

      <Button label={t.home.howToPlay} tone="ghost" onPress={onRules} />
    </ScrollView>
  );
}

function Segment<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.segmentWrap}>
      <Text style={styles.segmentLabel}>{label}</Text>
      <View style={styles.segment}>
        {options.map((option) => {
          const active = option.value === value;
          return (
            <Pressable
              key={String(option.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => {
                tap();
                onChange(option.value);
              }}
              style={[styles.segmentItem, active && styles.segmentItemActive]}
            >
              <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { padding: space(6), gap: space(6), flexGrow: 1, justifyContent: 'center' },
  topBar: { alignItems: 'flex-end' },
  language: {
    paddingVertical: space(1.5),
    paddingHorizontal: space(3),
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
  },
  languageText: { ...typography.small, fontSize: 12, color: colors.coralDeep },
  hero: { gap: space(3) },
  tagline: { ...typography.label, color: colors.coral, fontSize: 11 },
  blurb: { ...typography.body, color: colors.textMuted, lineHeight: 22 },

  panel: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space(4),
    gap: space(4),
  },
  segmentWrap: { gap: space(2) },
  segmentLabel: { ...typography.label, fontSize: 9, color: colors.textFaint },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.paperEdge,
    borderRadius: radius.pill,
    padding: 3,
    gap: 3,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: space(2.5),
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentItemActive: { backgroundColor: colors.surfaceRaised },
  segmentText: { ...typography.small, fontSize: 12, color: colors.textFaint },
  segmentTextActive: { color: colors.text },

  switchRow: { flexDirection: 'row', alignItems: 'center', gap: space(3) },
  switchText: { flex: 1, gap: 2 },
  switchLabel: { ...typography.body, color: colors.text },
  switchHint: { ...typography.small, fontSize: 11, color: colors.textFaint, lineHeight: 15 },

  actions: { gap: space(2) },
  online: { ...typography.small, fontSize: 11, color: colors.textFaint, textAlign: 'center', lineHeight: 16 },
  panelTitle: { ...typography.label, fontSize: 9, color: colors.coral },
});

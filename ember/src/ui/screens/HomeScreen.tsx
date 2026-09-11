import React from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import type { Difficulty } from '../../../shared/types';
import { Button } from '../components/Button';
import { Wordmark } from '../components/Wordmark';
import { tap } from '../haptics';
import { DIFFICULTIES, DIFFICULTY_LABEL } from '../labels';
import { colors, radius, space, type as typography } from '../theme';

export interface Settings {
  rivals: number;
  difficulty: Difficulty;
  assist: boolean;
}

interface Props {
  settings: Settings;
  onChange: (settings: Settings) => void;
  onPlay: () => void;
  onPlayOnline: () => void;
  onRules: () => void;
  /** Shown when there is already a signed-in account on this device. */
  signedInAs?: string | null;
}

export function HomeScreen({
  settings,
  onChange,
  onPlay,
  onPlayOnline,
  onRules,
  signedInAs,
}: Props) {
  return (
    <ScrollView contentContainerStyle={styles.screen} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <Wordmark size={46} />
        <Text style={styles.tagline}>Remember. Burn. Knock.</Text>
        <Text style={styles.blurb}>
          Four cards, face down. You saw two of them once. Keep the smallest pile at the table and
          call it before anyone beats you to it.
        </Text>
      </View>

      <View style={styles.actions}>
        <Button label="PLAY ONLINE" onPress={onPlayOnline} />
        <Text style={styles.online}>
          {signedInAs
            ? `Signed in as ${signedInAs}. Quick match, or a private table with friends.`
            : 'Quick match against people, or a private table just for your friends.'}
        </Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>AGAINST THE BOTS</Text>
        <Segment
          label="TABLE"
          options={[
            { value: 2, label: '3 players' },
            { value: 3, label: '4 players' },
            { value: 4, label: '5 players' },
          ]}
          value={settings.rivals}
          onChange={(rivals) => onChange({ ...settings, rivals })}
        />

        <Segment
          label="OPPONENTS"
          options={DIFFICULTIES.map((value) => ({
            value,
            label: DIFFICULTY_LABEL[value],
          }))}
          value={settings.difficulty}
          onChange={(difficulty) => onChange({ ...settings, difficulty })}
        />

        <View style={styles.switchRow}>
          <View style={styles.switchText}>
            <Text style={styles.switchLabel}>Assist mode</Text>
            <Text style={styles.switchHint}>Marks the cards you have already been shown.</Text>
          </View>
          <Switch
            value={settings.assist}
            onValueChange={(assist) => onChange({ ...settings, assist })}
            trackColor={{ false: colors.line, true: colors.ember }}
            thumbColor={colors.cream}
          />
        </View>

        <Button label="DEAL ME IN" tone="ghost" onPress={onPlay} />
      </View>

      <Button label="HOW TO PLAY" tone="ghost" onPress={onRules} />
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
  screen: { padding: space(6), gap: space(7), flexGrow: 1, justifyContent: 'center' },
  hero: { gap: space(3) },
  tagline: { ...typography.label, color: colors.ember, fontSize: 11 },
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
    backgroundColor: colors.bgDeep,
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
  panelTitle: { ...typography.label, fontSize: 9, color: colors.ember },
});

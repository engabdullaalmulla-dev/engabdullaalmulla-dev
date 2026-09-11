import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { Power } from '../../../shared/types';
import { useLanguage } from '../../i18n';
import { Button } from '../components/Button';
import { colors, radius, space, type as typography } from '../theme';

const POWERS: Array<{ on: string; power: Power }> = [
  { on: '7 · 8', power: 'PEEK' },
  { on: '9 · 10', power: 'SPY' },
  { on: 'J · Q', power: 'SWAP' },
  { on: 'K♠ K♣', power: 'LOOK_SWAP' },
  { on: 'JOKER', power: 'EMBER' },
];

export function RulesScreen({ onBack }: { onBack: () => void }) {
  const { t, n } = useLanguage();

  const values: Array<{ card: string; tint?: string; points: string; note?: string }> = [
    { card: 'K♥ K♦', tint: colors.suitRed, points: n(0), note: t.rules.valueNotes.bestCard },
    { card: 'A', points: n(1) },
    { card: `2 – 10`, points: t.rules.valueNotes.faceValue },
    { card: 'J', points: n(11) },
    { card: 'Q', points: n(12) },
    { card: 'K♠ K♣', points: n(13) },
    { card: t.cards.rank('JOKER'), tint: colors.ember, points: n(15), note: t.rules.valueNotes.getRidOfIt },
  ];

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel={t.common.back} onPress={onBack} hitSlop={12}>
          <Text style={styles.back} numberOfLines={1}>
            {t.common.backArrow} {t.common.back}
          </Text>
        </Pressable>
        <Text style={styles.title}>{t.rules.title}</Text>
        <View style={{ width: 62 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Section title={t.rules.thePoint}>
          {t.rules.pointBody.map((line) => (
            <Text key={line} style={styles.text}>
              {line}
            </Text>
          ))}
        </Section>

        <Section title={t.rules.yourTurn}>
          {t.rules.turnSteps.map((step, index) => (
            <View key={step} style={styles.bullet}>
              <Text style={styles.bulletNumber}>{n(index + 1)}</Text>
              <Text style={[styles.text, styles.bulletText]}>{step}</Text>
            </View>
          ))}
        </Section>

        <Section title={t.rules.burning}>
          {t.rules.burningBody.map((line) => (
            <Text key={line} style={styles.text}>
              {line}
            </Text>
          ))}
        </Section>

        <Section title={t.rules.knocking}>
          {t.rules.knockingBody.map((line) => (
            <Text key={line} style={styles.text}>
              {line}
            </Text>
          ))}
        </Section>

        <Section title={t.rules.values}>
          <View style={styles.table}>
            {values.map((row) => (
              <View key={row.card} style={styles.valueRow}>
                <View style={styles.chip}>
                  <Text style={[styles.chipText, row.tint ? { color: row.tint } : null]}>
                    {row.card}
                  </Text>
                </View>
                <Text style={styles.points}>{row.points}</Text>
                {row.note ? <Text style={styles.note}>{row.note}</Text> : null}
              </View>
            ))}
          </View>
        </Section>

        <Section title={t.rules.powersTitle}>
          <View style={styles.table}>
            {POWERS.map((row) => (
              <View key={row.on} style={styles.powerRow}>
                <View style={styles.chip}>
                  <Text style={styles.chipText}>
                    {row.on === 'JOKER' ? t.cards.rank('JOKER') : row.on}
                  </Text>
                </View>
                <View style={styles.powerText}>
                  <Text style={styles.powerName}>{t.powers[row.power].name}</Text>
                  <Text style={styles.note}>{t.powers[row.power].hint}</Text>
                </View>
              </View>
            ))}
          </View>
          <Text style={styles.text}>{t.rules.redKingNote}</Text>
        </Section>

        <Section title={t.rules.ending}>
          <Text style={styles.text}>{t.rules.endingBody}</Text>
        </Section>

        <Button label={t.common.gotIt} onPress={onBack} />
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: space(5) },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: space(3),
  },
  back: { ...typography.label, fontSize: 10, color: colors.textFaint, width: 62 },
  title: { ...typography.label, fontSize: 11, color: colors.goldSoft },
  body: { gap: space(6), paddingBottom: space(10) },

  section: { gap: space(2) },
  sectionTitle: { ...typography.heading, fontSize: 18, color: colors.goldSoft },
  text: { ...typography.body, color: colors.textMuted, lineHeight: 24 },

  bullet: { flexDirection: 'row', gap: space(3) },
  bulletNumber: { ...typography.numeral, fontSize: 15, color: colors.ember, marginTop: 2, width: 14 },
  bulletText: { flex: 1 },

  table: { gap: space(2), marginTop: space(1) },
  valueRow: { flexDirection: 'row', alignItems: 'center', gap: space(3) },
  powerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space(3) },
  powerText: { flex: 1, gap: 2 },
  powerName: { ...typography.body, color: colors.text },
  chip: {
    minWidth: 78,
    paddingVertical: space(1.5),
    paddingHorizontal: space(2),
    borderRadius: radius.sm,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
  },
  chipText: { ...typography.small, color: colors.text },
  points: { ...typography.body, color: colors.text, fontWeight: '800', minWidth: 86 },
  note: { ...typography.small, fontSize: 11, color: colors.textFaint, flexShrink: 1, lineHeight: 16 },
});

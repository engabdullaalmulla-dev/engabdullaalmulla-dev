import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { POWER_HINT, POWER_LABEL } from '../../../shared/cards';
import type { Power } from '../../../shared/types';
import { colors, radius, space, type as typography } from '../theme';
import { Button } from '../components/Button';

const VALUES: Array<{ card: string; tint?: string; points: string; note?: string }> = [
  { card: 'K♥ K♦', tint: colors.suitRed, points: '0', note: 'the best card in the deck' },
  { card: 'A', points: '1' },
  { card: '2 – 10', points: 'face value' },
  { card: 'J', points: '11' },
  { card: 'Q', points: '12' },
  { card: 'K♠ K♣', points: '13' },
  { card: 'Joker', tint: colors.ember, points: '15', note: 'get rid of it' },
];

const POWERS: Array<{ on: string; power: Power }> = [
  { on: '7 · 8', power: 'PEEK' },
  { on: '9 · 10', power: 'SPY' },
  { on: 'J · Q', power: 'SWAP' },
  { on: 'K♠ K♣', power: 'LOOK_SWAP' },
  { on: 'Joker', power: 'EMBER' },
];

export function RulesScreen({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={onBack} hitSlop={12}>
          <Text style={styles.back} numberOfLines={1}>← BACK</Text>
        </Pressable>
        <Text style={styles.title}>HOW TO PLAY</Text>
        <View style={{ width: 62 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Section title="The point">
          <Body>
            Two decks, 108 cards. Everyone gets four, face down. The pile in front of you is worth
            points, and points are bad — you want the lowest total at the table.
          </Body>
          <Body>
            Before play starts you look at two of your own cards. That is the last honest look you
            get. Everything after that is memory.
          </Body>
        </Section>

        <Section title="Your turn">
          <Bullet n="1">
            Draw the top of the stock, or take the face-up discard. A card you take off the discard
            has to go into your pile — no changing your mind.
          </Bullet>
          <Bullet n="2">
            Swap it for one of your cards (the old one goes face up on the discard), or throw the
            drawn card away.
          </Bullet>
          <Bullet n="3">
            Throw away a 7 or higher and you may use its power instead of keeping it. That is the
            trade: points now, or information now.
          </Bullet>
        </Section>

        <Section title="Burning">
          <Body>
            The moment a card lands face up, anyone may burn a card of the same rank straight out of
            their own pile — fewer cards, fewer points, and nobody gets to replace it.
          </Body>
          <Body>
            Get it wrong and you take a penalty card, face down, on top of what you already had. Be
            sure before you tap.
          </Body>
        </Section>

        <Section title="Knocking">
          <Body>
            When you think your pile is the smallest, knock at the start of your turn. Everyone else
            gets one last turn, then every card is turned over.
          </Body>
          <Body>
            Lowest at the table and the knock costs you nothing. Beaten by anyone, even tied, and it
            costs your pile plus ten.
          </Body>
        </Section>

        <Section title="What cards are worth">
          <View style={styles.table}>
            {VALUES.map((row) => (
              <View key={row.card} style={styles.valueRow}>
                <View style={styles.chip}>
                  <Text style={[styles.chipText, row.tint ? { color: row.tint } : null]}>{row.card}</Text>
                </View>
                <Text style={styles.points}>{row.points}</Text>
                {row.note ? <Text style={styles.note}>{row.note}</Text> : null}
              </View>
            ))}
          </View>
        </Section>

        <Section title="Powers">
          <View style={styles.table}>
            {POWERS.map((row) => (
              <View key={row.on} style={styles.powerRow}>
                <View style={styles.chip}>
                  <Text style={styles.chipText}>{row.on}</Text>
                </View>
                <View style={styles.powerText}>
                  <Text style={styles.powerName}>{POWER_LABEL[row.power]}</Text>
                  <Text style={styles.note}>{POWER_HINT[row.power]}</Text>
                </View>
              </View>
            ))}
          </View>
          <Body>
            A red King is already worth nothing, so it has nothing to spend — keep it.
          </Body>
        </Section>

        <Section title="Ending it">
          <Body>
            Round scores stack up. As soon as anyone reaches 100 the match is over, and whoever has
            the fewest points wins. Burn your pile away to nothing and the round ends on the spot,
            scoring you zero.
          </Body>
        </Section>

        <Button label="GOT IT" onPress={onBack} />
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

const Body = ({ children }: { children: React.ReactNode }) => <Text style={styles.text}>{children}</Text>;

const Bullet = ({ n, children }: { n: string; children: React.ReactNode }) => (
  <View style={styles.bullet}>
    <Text style={styles.bulletNumber}>{n}</Text>
    <Text style={[styles.text, styles.bulletText]}>{children}</Text>
  </View>
);

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: space(5) },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: space(3) },
  back: { ...typography.label, fontSize: 10, color: colors.textFaint, width: 62 },
  title: { ...typography.label, fontSize: 11, color: colors.textMuted },
  body: { gap: space(6), paddingBottom: space(10) },

  section: { gap: space(2) },
  sectionTitle: { ...typography.heading, fontSize: 17, color: colors.ember },
  text: { ...typography.body, color: colors.textMuted, lineHeight: 22 },

  bullet: { flexDirection: 'row', gap: space(3) },
  bulletNumber: { ...typography.label, fontSize: 11, color: colors.gold, marginTop: 3, width: 12 },
  bulletText: { flex: 1 },

  table: { gap: space(2), marginTop: space(1) },
  valueRow: { flexDirection: 'row', alignItems: 'center', gap: space(3) },
  powerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space(3) },
  powerText: { flex: 1, gap: 2 },
  powerName: { ...typography.body, color: colors.text },
  chip: {
    minWidth: 74,
    paddingVertical: space(1.5),
    paddingHorizontal: space(2),
    borderRadius: radius.sm,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
  },
  chipText: { ...typography.small, color: colors.text },
  points: { ...typography.body, color: colors.text, fontWeight: '800', minWidth: 80 },
  note: { ...typography.small, fontSize: 11, color: colors.textFaint, flexShrink: 1, lineHeight: 16 },
});

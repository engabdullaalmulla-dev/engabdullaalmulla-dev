import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { PlayerView } from '../../../shared/view';
import { colors, radius, space, type as typography } from '../theme';
import { PlayingCard, type CardHighlight } from './PlayingCard';

interface Props {
  player: PlayerView;
  active: boolean;
  knocked: boolean;
  /** Slots you are currently allowed to tap, for a power. */
  targetable?: number[];
  onPressSlot?: (slot: number) => void;
  /** Sized by the table so a pile never wraps onto a second line. */
  cardWidth: number;
}

export function Opponent({ player, active, knocked, targetable = [], onPressSlot, cardWidth }: Props) {
  return (
    <View style={[styles.wrap, active && styles.active]}>
      <View style={styles.header}>
        <Text
          style={[styles.name, active && { color: colors.ember }, !player.connected && styles.away]}
          numberOfLines={1}
        >
          {player.name}
        </Text>
        {!player.connected ? <Text style={styles.tag}>AWAY</Text> : null}
        {knocked ? <Text style={[styles.tag, styles.knock]}>KNOCKED</Text> : null}
        <Text style={styles.score}>{player.matchScore}</Text>
      </View>

      <View style={styles.cards}>
        {player.slots.map((slot, index) => {
          const highlight: CardHighlight = targetable.includes(index) ? 'target' : 'none';
          return (
            <PlayingCard
              key={`${player.id}-${index}`}
              card={slot.kind === 'face' ? slot.card : null}
              faceUp={slot.kind === 'face'}
              burned={slot.kind === 'burned'}
              width={cardWidth}
              highlight={highlight}
              onPress={targetable.includes(index) ? () => onPressSlot?.(index) : undefined}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    padding: space(2.5),
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: colors.surface,
    gap: space(2),
  },
  active: { borderColor: colors.ember, backgroundColor: colors.surfaceRaised },
  header: { flexDirection: 'row', alignItems: 'center', gap: space(1.5) },
  name: { ...typography.small, color: colors.text, flexShrink: 1 },
  away: { color: colors.textFaint },
  score: { ...typography.small, color: colors.textFaint, marginLeft: 'auto' },
  tag: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: colors.bg,
    backgroundColor: colors.textFaint,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    overflow: 'hidden',
  },
  knock: { backgroundColor: colors.gold },
  cards: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
});

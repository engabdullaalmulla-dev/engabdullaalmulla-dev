import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { Player } from '../../game/types';
import { colors, radius, space, type as typography } from '../theme';
import { PlayingCard, type CardHighlight } from './PlayingCard';

interface Props {
  player: Player;
  active: boolean;
  knocked: boolean;
  /** Slots the human is currently allowed to tap, for a power. */
  targetable?: number[];
  /** Slots that are face-up right now. */
  revealed?: number[];
  onPressSlot?: (slot: number) => void;
  /** Sized by the table so a pile never wraps onto a second line. */
  cardWidth: number;
}

export function Opponent({
  player,
  active,
  knocked,
  targetable = [],
  revealed = [],
  onPressSlot,
  cardWidth,
}: Props) {
  const width = cardWidth;

  return (
    <View style={[styles.wrap, active && styles.active]}>
      <View style={styles.header}>
        <Text style={[styles.name, active && { color: colors.ember }]} numberOfLines={1}>
          {player.name}
        </Text>
        {knocked ? <Text style={styles.knock}>KNOCKED</Text> : null}
        <Text style={styles.score}>{player.matchScore}</Text>
      </View>

      <View style={styles.cards}>
        {player.slots.map((card, slot) => {
          const highlight: CardHighlight = targetable.includes(slot) ? 'target' : 'none';
          return (
            <PlayingCard
              key={`${player.id}-${slot}`}
              card={card}
              faceUp={revealed.includes(slot)}
              burned={!card}
              width={width}
              highlight={highlight}
              onPress={targetable.includes(slot) ? () => onPressSlot?.(slot) : undefined}
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
  score: { ...typography.small, color: colors.textFaint, marginLeft: 'auto' },
  knock: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: colors.bg,
    backgroundColor: colors.gold,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    overflow: 'hidden',
  },
  cards: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
});

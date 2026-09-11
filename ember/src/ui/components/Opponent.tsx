import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { PlayerView } from '../../../shared/view';
import { AnchoredCard } from '../motion/AnchoredCard';
import { anchorKeys, useAnchor } from '../motion/anchors';
import { useLanguage } from '../../i18n';
import { colors, radius, space, type as typography } from '../theme';
import { Score } from './Score';
import { type CardHighlight } from './PlayingCard';

interface Props {
  player: PlayerView;
  active: boolean;
  knocked: boolean;
  /** Slots you are currently allowed to tap, for a power. */
  targetable?: number[];
  onPressSlot?: (slot: number) => void;
  /** True while a copy of that card is still in the air. */
  inFlight?: (slot: number) => boolean;
  cardWidth: number;
}

export function Opponent({
  player,
  active,
  knocked,
  targetable = [],
  onPressSlot,
  inFlight,
  cardWidth,
}: Props) {
  const { t, n } = useLanguage();
  const seat = useAnchor(anchorKeys.seat(player.id));

  return (
    <View {...seat} style={[styles.wrap, active && styles.active]}>
      <View style={styles.header}>
        <Text
          style={[styles.name, active && styles.nameActive, !player.connected && styles.away]}
          numberOfLines={1}
        >
          {player.name}
        </Text>
        {!player.connected ? <Text style={styles.tag}>{t.table.away}</Text> : null}
        {knocked ? <Text style={[styles.tag, styles.knock]}>{t.table.knocked}</Text> : null}
        <Score value={n(player.matchScore)} style={styles.score} />
      </View>

      <View style={styles.cards}>
        {player.slots.map((slot, index) => {
          const highlight: CardHighlight = targetable.includes(index) ? 'target' : 'none';
          return (
            <AnchoredCard
              key={`${player.id}-${index}`}
              anchorKey={anchorKeys.slot(player.id, index)}
              card={slot.kind === 'face' ? slot.card : null}
              faceUp={slot.kind === 'face'}
              burned={slot.kind === 'burned'}
              width={cardWidth}
              highlight={highlight}
              inFlight={inFlight?.(index)}
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
    paddingVertical: space(2),
    paddingHorizontal: space(2.5),
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: space(1.5),
  },
  active: {
    borderColor: colors.gold,
    backgroundColor: '#0E241C66',
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: space(1.5) },
  name: { ...typography.small, fontSize: 11, color: colors.textMuted, flexShrink: 1 },
  nameActive: { color: colors.goldSoft },
  away: { color: colors.textFaint },
  score: {
    ...typography.numeral,
    fontSize: 13,
    color: colors.text,
    marginStart: 'auto',
  },
  tag: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: colors.feltEdge,
    backgroundColor: colors.textFaint,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    overflow: 'hidden',
  },
  knock: { backgroundColor: colors.gold },
  cards: { flexDirection: 'row', gap: 4 },
});

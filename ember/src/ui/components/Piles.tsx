import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Card } from '../../game/types';
import { colors, radius, space, type as typography } from '../theme';
import { tap } from '../haptics';
import { PlayingCard } from './PlayingCard';

interface Props {
  stockCount: number;
  discardTop: Card | null;
  width: number;
  onDrawStock?: () => void;
  onDrawDiscard?: () => void;
  /** Draws attention to whichever pile can be tapped. */
  live?: 'none' | 'both';
}

export function Piles({ stockCount, discardTop, width, onDrawStock, onDrawDiscard, live = 'none' }: Props) {
  const enabled = live === 'both';

  return (
    <View style={styles.row}>
      <View style={styles.column}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Stock, ${stockCount} cards left`}
          disabled={!enabled || !onDrawStock}
          onPress={() => {
            tap();
            onDrawStock?.();
          }}
          style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.95 : 1 }] }]}
        >
          <View>
            {stockCount > 1 ? (
              <View style={[styles.shadowCard, { width, height: width * 1.42, borderRadius: width * 0.14 }]} />
            ) : null}
            <PlayingCard
              card={null}
              faceUp={false}
              width={width}
              highlight={enabled ? 'target' : 'none'}
            />
          </View>
        </Pressable>
        <Text style={styles.caption}>STOCK · {stockCount}</Text>
      </View>

      <View style={styles.column}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Discard pile"
          disabled={!enabled || !onDrawDiscard || !discardTop}
          onPress={() => {
            tap();
            onDrawDiscard?.();
          }}
          style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.95 : 1 }] }]}
        >
          {discardTop ? (
            <PlayingCard
              card={discardTop}
              faceUp
              width={width}
              highlight={enabled ? 'target' : 'none'}
            />
          ) : (
            <View style={[styles.empty, { width, height: width * 1.42, borderRadius: width * 0.14 }]} />
          )}
        </Pressable>
        <Text style={styles.caption}>DISCARD</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space(6), alignItems: 'flex-start' },
  column: { alignItems: 'center', gap: space(2) },
  caption: { ...typography.label, color: colors.textFaint, fontSize: 10 },
  shadowCard: {
    position: 'absolute',
    top: -4,
    left: 4,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  empty: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.line,
    borderRadius: radius.md,
  },
});

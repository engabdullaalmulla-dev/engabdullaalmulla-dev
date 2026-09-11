import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Card } from '../../../shared/types';
import { AnchoredCard } from '../motion/AnchoredCard';
import { anchorKeys } from '../motion/anchors';
import { tap } from '../haptics';
import { useLanguage } from '../../i18n';
import { colors, space, type as typography } from '../theme';
import { PlayingCard } from './PlayingCard';

interface Props {
  stockCount: number;
  discardTop: Card | null;
  width: number;
  onDrawStock?: () => void;
  onDrawDiscard?: () => void;
  /** Lights both piles when it is your move. */
  live?: boolean;
}

export function Piles({ stockCount, discardTop, width, onDrawStock, onDrawDiscard, live }: Props) {
  const { t, n } = useLanguage();
  const height = width * 1.45;

  return (
    <View style={styles.row}>
      <View style={styles.column}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.table.stockCount(n(stockCount))}
          disabled={!live || !onDrawStock}
          onPress={() => {
            tap();
            onDrawStock?.();
          }}
          style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.95 : 1 }] }]}
        >
          <View>
            {/* The depth of the deck, so the stock reads as a stack. */}
            {stockCount > 2 ? <View style={[styles.under, { width, height, top: -5, left: 5 }]} /> : null}
            {stockCount > 1 ? <View style={[styles.under, { width, height, top: -2.5, left: 2.5 }]} /> : null}
            <AnchoredCard
              anchorKey={anchorKeys.stock}
              card={null}
              faceUp={false}
              width={width}
              highlight={live ? 'target' : 'none'}
            />
          </View>
        </Pressable>
        <Text style={styles.caption}>{n(stockCount)}</Text>
      </View>

      <View style={styles.column}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.table.discardPile}
          disabled={!live || !onDrawDiscard || !discardTop}
          onPress={() => {
            tap();
            onDrawDiscard?.();
          }}
          style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.95 : 1 }] }]}
        >
          {discardTop ? (
            <AnchoredCard
              anchorKey={anchorKeys.discard}
              card={discardTop}
              faceUp
              width={width}
              highlight={live ? 'target' : 'none'}
            />
          ) : (
            <EmptyPile width={width} height={height} />
          )}
        </Pressable>
        <Text style={styles.caption}>{t.table.pile}</Text>
      </View>
    </View>
  );
}

function EmptyPile({ width, height }: { width: number; height: number }) {
  return <View style={[styles.empty, { width, height, borderRadius: width * 0.075 }]} />;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space(5), alignItems: 'flex-start' },
  column: { alignItems: 'center', gap: space(1.5) },
  caption: { ...typography.label, fontSize: 9, color: colors.goldFaint },
  under: {
    position: 'absolute',
    backgroundColor: colors.backInk,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.creamEdge,
    opacity: 0.55,
  },
  empty: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.hairline,
    opacity: 0.6,
  },
});

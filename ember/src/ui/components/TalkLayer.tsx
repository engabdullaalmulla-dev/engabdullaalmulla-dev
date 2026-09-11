import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { expression } from '../../../shared/expressions';
import { useLanguage } from '../../i18n';
import { anchorKeys, useAnchors, useOriginAnchor, type Rect } from '../motion/anchors';
import { colors, radius, shadow, space, type as typography } from '../theme';
import type { Said } from '../talk';

/**
 * Everything anyone has just said, drawn over the table.
 *
 * An emoji is thrown: it leaves the sender's seat, arcs across and lands on
 * whoever it was aimed at. A phrase is spoken: it sits in a bubble above the
 * sender and fades. Neither can be tapped, and neither moves a card.
 */

export function TalkLayer({ said, youId }: { said: Said[]; youId: string }) {
  const origin = useOriginAnchor();
  const anchors = useAnchors();

  const seatOf = (playerId: string): Rect | undefined =>
    anchors.first(
      anchorKeys.seat(playerId),
      anchorKeys.slot(playerId, 0),
      playerId === youId ? anchorKeys.hand : undefined,
    );

  return (
    <View {...origin} pointerEvents="none" style={styles.layer}>
      {said.map((entry) => {
        const what = expression(entry.id);
        if (!what) return null;
        const from = seatOf(entry.fromId);
        if (!from) return null;
        const to = entry.targetId ? seatOf(entry.targetId) : null;

        return what.kind === 'emoji' ? (
          <Thrown key={entry.key} glyph={what.glyph ?? '•'} from={from} to={to ?? null} />
        ) : (
          <Bubble key={entry.key} id={entry.id} from={from} />
        );
      })}
    </View>
  );
}

/** An emoji on its way from one seat to another. */
function Thrown({ glyph, from, to }: { glyph: string; from: Rect; to: Rect | null }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: to ? 2400 : 2000,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [progress, to]);

  const size = 40;
  const startX = from.x + from.width / 2 - size / 2;
  const startY = from.y + from.height / 2 - size / 2;
  const endX = to ? to.x + to.width / 2 - size / 2 : startX;
  // With nobody to aim at it simply rises out of the seat that sent it.
  const endY = to ? to.y + to.height / 2 - size / 2 : startY - 70;

  // The throw takes the first third; the rest is the emoji sitting there.
  const travel = [0, 0.34, 1];

  return (
    <Animated.Text
      allowFontScaling={false}
      style={[
        styles.thrown,
        {
          width: size,
          fontSize: size * 0.8,
          opacity: progress.interpolate({
            inputRange: [0, 0.08, 0.75, 1],
            outputRange: [0, 1, 1, 0],
          }),
          transform: [
            { translateX: progress.interpolate({ inputRange: travel, outputRange: [startX, endX, endX] }) },
            { translateY: progress.interpolate({ inputRange: travel, outputRange: [startY, endY, endY] }) },
            {
              scale: progress.interpolate({
                inputRange: [0, 0.34, 0.46, 1],
                outputRange: [0.4, 1.25, 1, 1],
              }),
            },
          ],
        },
      ]}
    >
      {glyph}
    </Animated.Text>
  );
}

/** A fixed phrase, in the reader's own language, over the seat that said it. */
function Bubble({ id, from }: { id: string; from: Rect }) {
  const { t } = useLanguage();
  const grow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(grow, { toValue: 1, friction: 7, tension: 90, useNativeDriver: true }).start();
  }, [grow]);

  const text = (t.express.phrase as Record<string, string>)[id] ?? '';

  return (
    <Animated.View
      style={[
        styles.bubbleWrap,
        {
          left: from.x + from.width / 2,
          top: from.y - 12,
          opacity: grow,
          transform: [{ scale: grow.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }],
        },
      ]}
    >
      <View style={styles.bubble}>
        <Text style={styles.bubbleText} numberOfLines={1}>
          {text}
        </Text>
      </View>
      <View style={styles.tail} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  layer: { ...StyleSheet.absoluteFill, zIndex: 60 },
  thrown: { position: 'absolute', top: 0, left: 0, textAlign: 'center' },
  bubbleWrap: {
    position: 'absolute',
    // Hung from its own middle so it stays centred over the seat.
    alignItems: 'center',
    marginLeft: -90,
    width: 180,
  },
  bubble: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: space(1.5),
    paddingHorizontal: space(3),
    maxWidth: 180,
    ...shadow.card,
  },
  bubbleText: { ...typography.small, fontSize: 12, color: colors.text },
  tail: {
    width: 10,
    height: 10,
    marginTop: -5,
    backgroundColor: colors.surfaceRaised,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.line,
    transform: [{ rotate: '45deg' }],
  },
});

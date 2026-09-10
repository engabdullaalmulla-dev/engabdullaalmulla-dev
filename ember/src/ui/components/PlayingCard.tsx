import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { isRed, SUIT_SYMBOL } from '../../game/cards';
import type { Card } from '../../game/types';
import { colors, radius, shadow } from '../theme';
import { Flame } from './Flame';

export type CardHighlight = 'none' | 'target' | 'burn' | 'chosen';

interface Props {
  card: Card | null;
  faceUp: boolean;
  width: number;
  onPress?: () => void;
  highlight?: CardHighlight;
  /** Marks a card you have seen this round (Assist mode only). */
  seen?: boolean;
  /** An empty space where a burned card used to be. */
  burned?: boolean;
  style?: ViewStyle;
}

const RATIO = 1.42;

export function PlayingCard({
  card,
  faceUp,
  width,
  onPress,
  highlight = 'none',
  seen,
  burned,
  style,
}: Props) {
  const height = width * RATIO;
  const spin = useRef(new Animated.Value(faceUp ? 1 : 0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  // The face is only mounted while it is visible. A card that is face down
  // must not be readable — not from the view tree, not by a screen reader,
  // and not from the DOM when this runs on the web.
  const [faceMounted, setFaceMounted] = useState(faceUp);

  useEffect(() => {
    if (faceUp) setFaceMounted(true);
    const animation = Animated.timing(spin, {
      toValue: faceUp ? 1 : 0,
      duration: 320,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start(({ finished }) => {
      if (finished && !faceUp) setFaceMounted(false);
    });
    return () => animation.stop();
  }, [faceUp, spin]);

  useEffect(() => {
    if (highlight === 'none') {
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 620, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 620, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [highlight, pulse]);

  if (burned) {
    return (
      <View
        style={[
          styles.burned,
          { width, height, borderRadius: width * 0.14 },
          style,
        ]}
      >
        <Flame size={width * 0.4} dim />
      </View>
    );
  }

  const frontStyle = {
    transform: [
      { perspective: 900 },
      {
        rotateY: spin.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] }),
      },
    ],
  };
  const backStyle = {
    transform: [
      { perspective: 900 },
      {
        rotateY: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }),
      },
    ],
  };

  const ring =
    highlight === 'burn' ? colors.bad : highlight === 'chosen' ? colors.gold : colors.ember;

  const label = card
    ? faceUp
      ? `${card.rank === 'JOKER' ? 'Joker' : card.rank} ${card.suit ? SUIT_SYMBOL[card.suit] : ''}, ${card.value} points`
      : 'face down card'
    : 'empty';

  const body = (
    <View style={{ width, height }}>
      <Animated.View style={[styles.face, { borderRadius: width * 0.14 }, backStyle]}>
        <CardBack width={width} />
      </Animated.View>
      <Animated.View style={[styles.face, { borderRadius: width * 0.14 }, frontStyle]}>
        {card && faceMounted ? <CardFront card={card} width={width} /> : null}
      </Animated.View>

      {highlight !== 'none' ? (
        <Animated.View
          style={[
            styles.ring,
            {
              borderRadius: width * 0.16,
              borderColor: ring,
              opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] }),
            },
          ]}
        />
      ) : null}

      {seen && !faceUp ? <View style={[styles.seenDot, { backgroundColor: colors.gold }]} /> : null}
    </View>
  );

  if (!onPress) {
    return (
      <View accessible accessibilityLabel={label} style={style}>
        {body}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [style, { transform: [{ scale: pressed ? 0.95 : 1 }] }]}
    >
      {body}
    </Pressable>
  );
}

function CardFront({ card, width }: { card: Card; width: number }) {
  const red = isRed(card.suit);
  const tint = card.rank === 'JOKER' ? colors.ember : red ? colors.suitRed : colors.suitBlack;
  const corner = Math.max(9, width * 0.2);
  const centre = Math.max(16, width * 0.46);

  return (
    <View style={[styles.front, { borderRadius: width * 0.14, padding: width * 0.08 }]}>
      <Text style={[styles.corner, { color: tint, fontSize: corner }]} numberOfLines={1}>
        {card.rank === 'JOKER' ? '★' : card.rank}
      </Text>

      <View style={styles.centre}>
        {card.rank === 'JOKER' ? (
          <Flame size={centre} />
        ) : (
          <Text style={[styles.pip, { color: tint, fontSize: centre }]}>
            {SUIT_SYMBOL[card.suit!]}
          </Text>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={[styles.value, { fontSize: Math.max(8, width * 0.16) }]}>{card.value}</Text>
      </View>
    </View>
  );
}

function CardBack({ width }: { width: number }) {
  return (
    <View style={[styles.back, { borderRadius: width * 0.14 }]}>
      <View style={[styles.backInner, { borderRadius: width * 0.1, margin: width * 0.07 }]}>
        <Flame size={width * 0.42} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  face: {
    ...StyleSheet.absoluteFill,
    backfaceVisibility: 'hidden',
    overflow: 'hidden',
    ...shadow.card,
  },
  front: {
    flex: 1,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.cardEdge,
    justifyContent: 'space-between',
  },
  back: {
    flex: 1,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backInner: {
    flex: 1,
    alignSelf: 'stretch',
    borderWidth: 1,
    borderColor: colors.ember,
    opacity: 0.55,
    alignItems: 'center',
    justifyContent: 'center',
  },
  corner: { fontWeight: '800', lineHeight: undefined },
  centre: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  pip: { fontWeight: '600' },
  footer: { alignItems: 'flex-end' },
  value: { color: colors.inkSoft, fontWeight: '800' },
  ring: {
    ...StyleSheet.absoluteFill,
    borderWidth: 3,
    margin: -3,
    pointerEvents: 'none',
  },
  burned: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.5,
  },
  seenDot: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 7,
    height: 7,
    borderRadius: 4,
  },
});

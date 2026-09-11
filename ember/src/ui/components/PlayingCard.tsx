import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';

import { isRed, SUIT_SYMBOL } from '../../../shared/cards';
import type { Card, Rank } from '../../../shared/types';
import { useLanguage } from '../../i18n';
import { directionStyle, LTR } from '../ltr';
import { colors, fonts, shadow } from '../theme';
import { CARD_BACK } from '../textures';
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
  /** Hidden while a flying copy of this card is in the air. */
  inFlight?: boolean;
  style?: ViewStyle;
}

const RATIO = 1.45;

/**
 * Where the pips sit, as fractions of the card's field. These are the standard
 * arrangements from a real deck — which is why a seven is not just six with one
 * more stuck in the middle.
 */
const PIPS: Partial<Record<Rank, Array<[number, number]>>> = {
  A: [[0.5, 0.5]],
  '2': [[0.5, 0.06], [0.5, 0.94]],
  '3': [[0.5, 0.06], [0.5, 0.5], [0.5, 0.94]],
  '4': [[0.2, 0.06], [0.8, 0.06], [0.2, 0.94], [0.8, 0.94]],
  '5': [[0.2, 0.06], [0.8, 0.06], [0.5, 0.5], [0.2, 0.94], [0.8, 0.94]],
  '6': [[0.2, 0.06], [0.8, 0.06], [0.2, 0.5], [0.8, 0.5], [0.2, 0.94], [0.8, 0.94]],
  '7': [
    [0.2, 0.06], [0.8, 0.06], [0.5, 0.28],
    [0.2, 0.5], [0.8, 0.5], [0.2, 0.94], [0.8, 0.94],
  ],
  '8': [
    [0.2, 0.06], [0.8, 0.06], [0.5, 0.28],
    [0.2, 0.5], [0.8, 0.5], [0.5, 0.72], [0.2, 0.94], [0.8, 0.94],
  ],
  '9': [
    [0.2, 0.04], [0.8, 0.04], [0.2, 0.36], [0.8, 0.36], [0.5, 0.5],
    [0.2, 0.64], [0.8, 0.64], [0.2, 0.96], [0.8, 0.96],
  ],
  '10': [
    [0.2, 0.04], [0.8, 0.04], [0.5, 0.2], [0.2, 0.36], [0.8, 0.36],
    [0.2, 0.64], [0.8, 0.64], [0.5, 0.8], [0.2, 0.96], [0.8, 0.96],
  ],
};

const COURT: Partial<Record<Rank, string>> = { J: 'J', Q: 'Q', K: 'K' };

export function PlayingCard({
  card,
  faceUp,
  width,
  onPress,
  highlight = 'none',
  seen,
  burned,
  inFlight,
  style,
}: Props) {
  const { t } = useLanguage();
  const height = width * RATIO;
  const corner = width * 0.075;
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
      duration: 460,
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
        Animated.timing(pulse, { toValue: 1, duration: 950, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 950, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [highlight, pulse]);

  if (burned) {
    return (
      <View
        accessible
        accessibilityLabel={t.table.emptySpace}
        style={[styles.burned, { width, height, borderRadius: corner }, style]}
      >
        <Flame size={width * 0.34} dim />
      </View>
    );
  }

  const label =
    card && faceUp
      ? t.table.cardWorth(t.cards.rank(card.rank), t.cards.suit(card.suit), t.digits(card.value))
      : t.table.faceDownCard;

  const ring = highlight === 'burn' ? colors.coral : highlight === 'chosen' ? colors.coralSoft : colors.coral;

  const body = (
    <View {...LTR} style={[{ width, height, opacity: inFlight ? 0 : 1 }, directionStyle('ltr')]}>
      <Animated.View
        style={[
          styles.face,
          { borderRadius: corner },
          {
            transform: [
              { perspective: 900 },
              { rotateY: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }) },
            ],
          },
        ]}
      >
        <CardBack width={width} />
      </Animated.View>

      <Animated.View
        style={[
          styles.face,
          { borderRadius: corner },
          {
            transform: [
              { perspective: 900 },
              { rotateY: spin.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] }) },
            ],
          },
        ]}
      >
        {card && faceMounted ? <CardFace card={card} width={width} /> : null}
      </Animated.View>

      {highlight !== 'none' ? (
        <Animated.View
          style={[
            styles.ring,
            {
              borderRadius: corner + 3,
              borderColor: ring,
              opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }),
            },
          ]}
        />
      ) : null}

      {seen && !faceUp ? <View style={styles.seenDot} /> : null}
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
      style={({ pressed }) => [style, { transform: [{ scale: pressed ? 0.94 : 1 }] }]}
    >
      {body}
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */

function CardFace({ card, width }: { card: Card; width: number }) {
  const red = isRed(card.suit);
  const tint = card.rank === 'JOKER' ? colors.coral : red ? colors.suitRed : colors.suitBlack;
  const corner = width * 0.075;
  // Below about this width there is no room for corner indices and pips, so a
  // small card says its piece plainly instead of pretending to be a real one.
  const tiny = width < 46;
  const suit = card.suit ? SUIT_SYMBOL[card.suit] : '';
  const rank = card.rank === 'JOKER' ? '★' : card.rank;

  if (tiny) {
    return (
      <View style={[styles.faceBody, { borderRadius: corner }]}>
        <Text style={[styles.tinyRank, { color: tint, fontSize: width * 0.42 }]} numberOfLines={1}>
          {rank}
        </Text>
        {card.rank !== 'JOKER' ? (
          <Text style={[styles.tinySuit, { color: tint, fontSize: width * 0.3 }]}>{suit}</Text>
        ) : null}
      </View>
    );
  }

  return (
    <View style={[styles.faceBody, { borderRadius: corner }]}>
      <Index rank={rank} suit={suit} tint={tint} width={width} />
      <Index rank={rank} suit={suit} tint={tint} width={width} mirrored />

      <View style={[styles.field, { marginHorizontal: width * 0.19, marginVertical: width * 0.3 }]}>
        {card.rank === 'JOKER' ? (
          <Flame size={width * 0.4} />
        ) : PIPS[card.rank] ? (
          PIPS[card.rank]!.map(([x, y], index) => {
            // An ace carries one big pip, the way a real one does.
            const size = card.rank === 'A' ? width * 0.4 : width * 0.24;
            const box = size * 1.25;
            return (
              <Text
                key={index}
                style={[
                  styles.pip,
                  {
                    color: tint,
                    fontSize: size,
                    lineHeight: box,
                    width: box,
                    height: box,
                    left: `${x * 100}%`,
                    top: `${y * 100}%`,
                    marginLeft: -box / 2,
                    marginTop: -box / 2,
                    transform: [{ rotate: y > 0.5 ? '180deg' : '0deg' }],
                  },
                ]}
              >
                {suit}
              </Text>
            );
          })
        ) : (
          <View
            style={[
              styles.court,
              { borderColor: colors.coral, borderRadius: width * 0.05, margin: width * 0.05 },
            ]}
          >
            <Text style={[styles.courtLetter, { color: tint, fontSize: width * 0.4 }]}>
              {COURT[card.rank]}
            </Text>
            <Text style={[styles.courtSuit, { color: tint, fontSize: width * 0.18 }]}>{suit}</Text>
          </View>
        )}
      </View>

      {/* The point value, but only where the card does not already say it: a
          nine is worth nine, while a red King is worth nothing and a Joker
          fifteen. */}
      {String(card.value) !== card.rank ? (
      <View
        style={[
          styles.value,
          {
            width: width * 0.27,
            height: width * 0.27,
            borderRadius: width * 0.135,
            right: width * 0.06,
            top: width * 0.06,
          },
        ]}
      >
        <Text style={[styles.valueText, { fontSize: width * 0.16 }]}>{card.value}</Text>
      </View>
      ) : null}
    </View>
  );
}

function Index({
  rank,
  suit,
  tint,
  width,
  mirrored,
}: {
  rank: string;
  suit: string;
  tint: string;
  width: number;
  mirrored?: boolean;
}) {
  return (
    <View
      style={[
        styles.index,
        mirrored
          ? { right: width * 0.07, bottom: width * 0.07, transform: [{ rotate: '180deg' }] }
          : { left: width * 0.07, top: width * 0.07 },
      ]}
    >
      <Text style={[styles.indexRank, { color: tint, fontSize: width * 0.2 }]}>{rank}</Text>
      <Text style={[styles.indexSuit, { color: tint, fontSize: width * 0.16 }]}>{suit}</Text>
    </View>
  );
}

function CardBack({ width }: { width: number }) {
  const corner = width * 0.075;
  return (
    <View style={[styles.back, { borderRadius: corner }]}>
      <ImageBackground
        source={{ uri: CARD_BACK }}
        resizeMode="repeat"
        style={[styles.backPattern, { margin: width * 0.055, borderRadius: corner * 0.7 }]}
        imageStyle={{ borderRadius: corner * 0.7 }}
      >
        <View
          style={[
            styles.medallion,
            {
              width: width * 0.44,
              height: width * 0.44,
              borderRadius: width * 0.22,
            },
          ]}
        >
          <Flame size={width * 0.24} />
        </View>
      </ImageBackground>
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
  faceBody: {
    flex: 1,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.creamEdge,
  },
  field: { flex: 1 },
  pip: { position: 'absolute', fontWeight: '500', textAlign: 'center' },

  index: { position: 'absolute', alignItems: 'center' },
  indexRank: { fontFamily: fonts.display, fontWeight: '700', lineHeight: undefined },
  indexSuit: { marginTop: -2 },

  court: {
    flex: 1,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.creamShade,
  },
  courtLetter: { fontFamily: fonts.display, fontWeight: '700' },
  courtSuit: { marginTop: -2 },

  tinyRank: { fontFamily: fonts.display, fontWeight: '700', textAlign: 'center', marginTop: '14%' },
  tinySuit: { textAlign: 'center', marginTop: -2 },

  value: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.creamShade,
    borderWidth: 1,
    borderColor: colors.coral,
  },
  valueText: { fontFamily: fonts.display, fontWeight: '700', color: colors.inkSoft },

  back: { flex: 1, backgroundColor: colors.cream, borderWidth: 1, borderColor: colors.creamEdge },
  backPattern: { flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  medallion: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cream,
    borderWidth: 1.5,
    borderColor: colors.coralDeep,
  },

  ring: { ...StyleSheet.absoluteFill, borderWidth: 3, margin: -3, pointerEvents: 'none' },
  burned: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.45,
  },
  seenDot: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.coral,
  },
});

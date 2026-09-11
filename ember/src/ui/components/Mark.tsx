import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { parseAvatar, type Avatar, type AvatarColour } from '../../../shared/progress';
import { colors, radius } from '../theme';

/**
 * The mark beside a name.
 *
 * A shape in a disc, chosen by the player or, failing that, derived from who
 * they are — so every seat at the table looks like somebody rather than like
 * a blank.
 */

export const MARK_COLOURS: Record<AvatarColour, string> = {
  coral: colors.coral,
  sage: colors.sageDeep,
  navy: colors.text,
  gold: '#C9922F',
  plum: '#9B5E7E',
  teal: '#3F8C93',
};

const GLYPH: Record<Exclude<Avatar['shape'], 'flame'>, string> = {
  spade: '♠',
  heart: '♥',
  diamond: '♦',
  club: '♣',
  star: '★',
};

export function Mark({
  avatar,
  seed = '',
  size = 34,
  style,
}: {
  /** The stored "shape:colour", if there is one. */
  avatar?: string | null;
  /** Something to derive a mark from when there is not. */
  seed?: string;
  size?: number;
  style?: ViewStyle;
}) {
  const mark = parseAvatar(avatar, seed);
  const tint = MARK_COLOURS[mark.colour];

  return (
    <View
      style={[
        styles.disc,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: `${tint}1F`,
          borderColor: `${tint}59`,
        },
        style,
      ]}
    >
      {mark.shape === 'flame' ? (
        <Flame size={Math.round(size * 0.46)} tint={tint} />
      ) : (
        <Text
          allowFontScaling={false}
          style={[styles.glyph, { color: tint, fontSize: Math.round(size * 0.52) }]}
        >
          {GLYPH[mark.shape]}
        </Text>
      )}
    </View>
  );
}

/**
 * No font has a flame that sits properly beside the card suits, so this one
 * is drawn: a square with one sharp corner, turned to point upwards.
 */
function Flame({ size, tint }: { size: number; tint: string }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        backgroundColor: tint,
        borderTopLeftRadius: 0,
        borderTopRightRadius: size / 2,
        borderBottomRightRadius: size / 2,
        borderBottomLeftRadius: size / 2,
        transform: [{ rotate: '45deg' }],
      }}
    />
  );
}

const styles = StyleSheet.create({
  disc: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderCurve: 'continuous',
  },
  glyph: { lineHeight: undefined, textAlign: 'center' },
});

export const markRadius = radius.pill;

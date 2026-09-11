import React from 'react';
import { Image } from 'react-native';

import { EMBLEM, EMBLEM_ASPECT } from '../marks';
import { colors } from '../theme';

/**
 * The mark: a playing card with the fire knocked out of the middle of it.
 *
 * One shape that says card game and says fire, and holds together down to a
 * favicon. The flame is a hole rather than a fill, so the mark takes its
 * background from whatever it is set on — paper here, cream in the app icon.
 */
/** `size` is the card's height; the width follows from the card's own shape. */
export function Emblem({ size = 44, tint }: { size?: number; tint?: string }) {
  return (
    <Image
      source={{ uri: EMBLEM }}
      tintColor={tint ?? colors.coral}
      style={{ width: size * EMBLEM_ASPECT, height: size }}
      accessible={false}
    />
  );
}

import React from 'react';
import { Image } from 'react-native';

import { FLAME_GLYPH } from '../marks';
import { colors } from '../theme';

/**
 * Fire, wherever the game needs a little of it: the medallion on a card back,
 * the head of the burn meter, the room screen.
 *
 * It is a drawn outline rather than a couple of rounded boxes, because a
 * rounded box tapering to a point is a drop of water however it is coloured.
 */
export function Flame({
  size = 26,
  dim = false,
  tint,
}: {
  size?: number;
  dim?: boolean;
  /** Overrides the colour entirely — used for the marks beside names. */
  tint?: string;
}) {
  return (
    <Image
      source={{ uri: FLAME_GLYPH }}
      // The silhouette is white, so every use is a tint away from any colour.
      tintColor={tint ?? (dim ? colors.hairline : colors.coral)}
      style={{ width: size, height: size }}
      resizeMode="contain"
      accessible={false}
    />
  );
}

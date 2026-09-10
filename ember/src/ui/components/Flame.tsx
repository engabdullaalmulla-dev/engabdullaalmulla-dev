import React from 'react';
import { View } from 'react-native';

import { colors } from '../theme';

/**
 * The mark that stands in for the second E in EMBER: a teardrop of fire, built
 * out of two rotated rounded squares so it needs no image asset.
 */
export function Flame({ size = 26, dim = false }: { size?: number; dim?: boolean }) {
  const corner = size * 0.5;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: size * 0.86,
          height: size * 0.86,
          backgroundColor: dim ? colors.line : colors.ember,
          transform: [{ rotate: '45deg' }],
          borderTopLeftRadius: size * 0.1,
          borderTopRightRadius: corner,
          borderBottomLeftRadius: corner,
          borderBottomRightRadius: corner,
        }}
      />
      <View
        style={{
          position: 'absolute',
          bottom: size * 0.14,
          width: size * 0.38,
          height: size * 0.38,
          borderRadius: size * 0.19,
          backgroundColor: dim ? colors.surfaceRaised : colors.gold,
          opacity: 0.9,
        }}
      />
    </View>
  );
}

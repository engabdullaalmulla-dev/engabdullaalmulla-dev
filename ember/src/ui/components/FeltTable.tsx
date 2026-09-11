import React from 'react';
import { Image, ImageBackground, StyleSheet, View } from 'react-native';

import { colors } from '../theme';
import { FELT, FELT_LIGHT } from '../textures';

/**
 * The table everything happens on: baize, with a light hung over the middle of
 * it so the cards in play sit in the brightest part and the edges fall away.
 */
export function FeltTable({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.root}>
      <ImageBackground
        source={{ uri: FELT }}
        resizeMode="repeat"
        style={styles.behind}
      />
      <Image
        source={{ uri: FELT_LIGHT }}
        resizeMode="stretch"
        style={styles.behind}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.felt },
  behind: { ...StyleSheet.absoluteFill, pointerEvents: 'none' },
});

import React from 'react';
import { Image, ImageBackground, StyleSheet, View } from 'react-native';

import { colors } from '../theme';
import { PAPER, TABLE_LIGHT } from '../textures';

/**
 * The table everything happens on: warm paper with daylight across it,
 * brightest where the cards are and settling into a soft shade at the edges.
 */
export function TableSurface({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.root}>
      <ImageBackground source={{ uri: PAPER }} resizeMode="repeat" style={styles.behind} />
      <Image source={{ uri: TABLE_LIGHT }} resizeMode="stretch" style={styles.behind} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper },
  behind: { ...StyleSheet.absoluteFill, pointerEvents: 'none' },
});

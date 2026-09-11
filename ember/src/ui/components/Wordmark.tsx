import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { LTR } from '../ltr';
import { colors, fonts } from '../theme';
import { Flame } from './Flame';

export function Wordmark({ size = 44 }: { size?: number }) {
  return (
    <View {...LTR} style={styles.row}>
      <Text style={[styles.text, { fontSize: size, letterSpacing: size * 0.13 }]}>EMB</Text>
      <Flame size={size * 0.72} />
      <Text style={[styles.text, { fontSize: size, letterSpacing: size * 0.13, marginLeft: size * 0.16 }]}>
        R
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // The mark is three pieces in a row — EMB, the flame, R — so right-to-left
  // would lay it out backwards. A name in Latin script does not mirror, any
  // more than the cards do.
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    direction: 'ltr',
    // Reads left to right, but still sits where the language starts — on the
    // right in Arabic, with everything else.
    alignSelf: 'flex-start',
  },
  text: { fontFamily: fonts.display, color: colors.text, fontWeight: '700' },
});

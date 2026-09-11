import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { directionStyle, LTR } from '../ltr';
import { colors, fonts } from '../theme';
import { Emblem } from './Emblem';

/**
 * EMBER, with the mark standing in for the second E. The word and the symbol
 * are the same object, so the logo works with the letters or without them.
 */
export function Wordmark({ size = 44 }: { size?: number }) {
  return (
    <View {...LTR} style={[styles.row, directionStyle('ltr')]}>
      <Text style={[styles.text, { fontSize: size, letterSpacing: size * 0.13 }]}>EMB</Text>
      <Emblem size={size * 0.86} />
      <Text style={[styles.text, { fontSize: size, letterSpacing: size * 0.13, marginLeft: size * 0.12 }]}>
        R
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // The mark is three pieces in a row — EMB, the emblem, R — so right-to-left
  // would lay it out backwards. A name in Latin script does not mirror, any
  // more than the cards do.
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    // Reads left to right, but still sits where the language starts — on the
    // right in Arabic, with everything else.
    alignSelf: 'flex-start',
  },
  text: { fontFamily: fonts.display, color: colors.text, fontWeight: '700' },
});

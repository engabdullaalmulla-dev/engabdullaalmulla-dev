import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme';
import { Flame } from './Flame';

export function Wordmark({ size = 44 }: { size?: number }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.text, { fontSize: size, letterSpacing: size * 0.13 }]}>EMB</Text>
      <Flame size={size * 0.72} />
      <Text style={[styles.text, { fontSize: size, letterSpacing: size * 0.13, marginLeft: size * 0.16 }]}>
        R
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  text: { color: colors.text, fontWeight: '800' },
});

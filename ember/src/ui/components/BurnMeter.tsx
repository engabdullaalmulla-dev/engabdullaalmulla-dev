import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { useLanguage } from '../../i18n';
import { colors, radius, space, type as typography } from '../theme';

/** The bar that runs down while the burn window is open. */
export function BurnMeter({ closesAt, totalMs }: { closesAt: number; totalMs: number }) {
  const { t } = useLanguage();
  const progress = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const remaining = Math.max(0, closesAt - Date.now());
    progress.setValue(remaining / totalMs);
    const animation = Animated.timing(progress, {
      toValue: 0,
      duration: remaining,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [closesAt, totalMs, progress]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{t.table.burnWindow}</Text>
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            {
              width: progress.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space(1), alignSelf: 'stretch' },
  label: { ...typography.label, fontSize: 9, color: colors.ember, textAlign: 'center' },
  track: {
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.line,
    overflow: 'hidden',
  },
  fill: { height: 4, backgroundColor: colors.ember, borderRadius: radius.pill },
});

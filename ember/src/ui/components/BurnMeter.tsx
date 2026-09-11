import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { useLanguage } from '../../i18n';
import { colors, radius, space, type as typography } from '../theme';
import { Flame } from './Flame';

/**
 * The clock on the burn window.
 *
 * This is the one moment in the game where a tap costs you something, and it
 * arrives without being asked for — so it says so loudly: a count you can
 * read, a bar that runs out, and both of them reddening as the time goes.
 */
export function BurnMeter({ closesAt, totalMs }: { closesAt: number; totalMs: number }) {
  const { t, n } = useLanguage();
  const progress = useRef(new Animated.Value(1)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const [left, setLeft] = useState(() => Math.max(0, Math.ceil((closesAt - Date.now()) / 1000)));

  useEffect(() => {
    const remaining = Math.max(0, closesAt - Date.now());
    progress.setValue(remaining / totalMs);
    const running = Animated.timing(progress, {
      toValue: 0,
      duration: remaining,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    running.start();

    const tick = () => setLeft(Math.max(0, Math.ceil((closesAt - Date.now()) / 1000)));
    tick();
    const timer = setInterval(tick, 120);
    return () => {
      running.stop();
      clearInterval(timer);
    };
  }, [closesAt, totalMs, progress]);

  useEffect(() => {
    const beat = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    beat.start();
    return () => beat.stop();
  }, [pulse]);

  // Ember while there is time, red as it runs out.
  const heat = progress.interpolate({
    inputRange: [0, 0.45, 1],
    outputRange: [colors.coralDeep, colors.coral, colors.coralSoft],
  });

  return (
    <View style={styles.wrap}>
      <Animated.View
        style={[
          styles.head,
          { transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] }) }] },
        ]}
      >
        <Flame size={16} />
        <Text style={styles.label}>{t.table.burnWindow}</Text>
        <Animated.Text style={[styles.count, { color: heat }]}>{n(left)}</Animated.Text>
      </Animated.View>

      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            {
              backgroundColor: heat,
              width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space(1), alignSelf: 'stretch' },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space(2) },
  label: { ...typography.label, fontSize: 10, color: colors.coral },
  count: { ...typography.numeral, fontSize: 20, minWidth: 18, textAlign: 'center' },
  track: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.paperShade,
    overflow: 'hidden',
  },
  fill: { height: 6, borderRadius: radius.pill },
});

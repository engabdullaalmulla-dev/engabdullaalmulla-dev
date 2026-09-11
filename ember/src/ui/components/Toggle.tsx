import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet } from 'react-native';

import { useLanguage } from '../../i18n';
import { tap } from '../haptics';
import { colors, radius } from '../theme';

/**
 * A switch of our own.
 *
 * The platform one comes with its own idea of what "on" looks like — a teal
 * thumb on the web that no amount of props talks out of it — and this is a
 * two-state control, which is not much to draw.
 */
export function Toggle({
  value,
  onValueChange,
  label,
}: {
  value: boolean;
  onValueChange: (next: boolean) => void;
  label?: string;
}) {
  const { rtl } = useLanguage();
  const slide = useRef(new Animated.Value(value ? 1 : 0)).current;
  // The track is laid out from the reading side, so "on" travels the other
  // way round in Arabic.
  const travel = rtl ? -22 : 22;

  useEffect(() => {
    Animated.timing(slide, {
      toValue: value ? 1 : 0,
      duration: 260,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [value, slide]);

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      hitSlop={10}
      onPress={() => {
        tap();
        onValueChange(!value);
      }}
      style={({ pressed }) => [styles.track, pressed && styles.pressed]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          styles.fill,
          {
            backgroundColor: slide.interpolate({
              inputRange: [0, 1],
              outputRange: [colors.paperShade, colors.coral],
            }),
          },
        ]}
      />
      <Animated.View
        style={[
          styles.thumb,
          {
            transform: [
              { translateX: slide.interpolate({ inputRange: [0, 1], outputRange: [0, travel] }) },
            ],
          },
        ]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 52,
    height: 30,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    justifyContent: 'center',
    padding: 3,
    overflow: 'hidden',
  },
  pressed: { opacity: 0.85 },
  fill: { borderRadius: radius.pill },
  thumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.surfaceRaised,
    shadowColor: '#8A6A4A',
    shadowOpacity: 0.25,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
});

import React from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { colors, radius, shadow, space } from '../theme';
import { tap } from '../haptics';

interface Props {
  label: string;
  onPress: () => void;
  tone?: 'ember' | 'ghost' | 'quiet' | 'danger';
  disabled?: boolean;
  small?: boolean;
  style?: ViewStyle;
}

export function Button({ label, onPress, tone = 'ember', disabled, small, style }: Props) {
  const palette = {
    ember: { bg: colors.ember, border: colors.ember, text: '#1B0F08' },
    danger: { bg: colors.bad, border: colors.bad, text: '#210B08' },
    ghost: { bg: 'transparent', border: colors.line, text: colors.text },
    quiet: { bg: colors.surfaceRaised, border: colors.surfaceRaised, text: colors.textMuted },
  }[tone];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [
        styles.base,
        small && styles.small,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          opacity: disabled ? 0.35 : pressed ? 0.82 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
        tone === 'ember' && !disabled ? shadow.lift : null,
        style,
      ]}
    >
      <View>
        <Text style={[styles.label, small && styles.labelSmall, { color: palette.text }]}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: space(3.5),
    paddingHorizontal: space(6),
    borderRadius: radius.pill,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  small: {
    paddingVertical: space(2.5),
    paddingHorizontal: space(4),
    minHeight: 40,
  },
  label: { fontSize: 15, fontWeight: '800', letterSpacing: 1.2 },
  labelSmall: { fontSize: 13, letterSpacing: 1 },
});

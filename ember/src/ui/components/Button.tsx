import React from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { tap } from '../haptics';
import { colors, radius, shadow, space, type as typography } from '../theme';

interface Props {
  label: string;
  onPress: () => void;
  tone?: 'ember' | 'gold' | 'ghost' | 'quiet' | 'danger';
  disabled?: boolean;
  small?: boolean;
  style?: ViewStyle;
}

const TONES = {
  ember: { bg: colors.ember, border: colors.emberSoft, text: '#200A03', lit: true },
  gold: { bg: 'transparent', border: colors.gold, text: colors.goldSoft, lit: false },
  ghost: { bg: '#0E241C99', border: colors.hairline, text: colors.text, lit: false },
  quiet: { bg: 'transparent', border: colors.line, text: colors.textFaint, lit: false },
  danger: { bg: colors.bad, border: colors.bad, text: '#230806', lit: false },
} as const;

export function Button({ label, onPress, tone = 'ember', disabled, small, style }: Props) {
  const palette = TONES[tone];

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
          opacity: disabled ? 0.35 : pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
        palette.lit && !disabled ? shadow.lit : null,
        style,
      ]}
    >
      <View>
        <Text style={[styles.label, small && styles.labelSmall, { color: palette.text }]}>
          {label}
        </Text>
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
  small: { paddingVertical: space(2.5), paddingHorizontal: space(4), minHeight: 40 },
  label: { ...typography.label, fontSize: 14 },
  labelSmall: { fontSize: 12, letterSpacing: 1.2 },
});

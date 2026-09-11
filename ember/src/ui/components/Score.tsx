import React, { useEffect, useRef } from 'react';
import { Animated, Easing, type StyleProp, type TextStyle } from 'react-native';

/** A number that gives a little when it changes, so a score never just jumps. */
export function Score({ value, style }: { value: string | number; style?: StyleProp<TextStyle> }) {
  const pop = useRef(new Animated.Value(0)).current;
  const previous = useRef(value);

  useEffect(() => {
    if (value === previous.current) return;
    previous.current = value;
    pop.setValue(1);
    Animated.timing(pop, {
      toValue: 0,
      duration: 520,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [value, pop]);

  return (
    <Animated.Text
      style={[
        style,
        { transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [1, 1.4] }) }] },
      ]}
    >
      {value}
    </Animated.Text>
  );
}

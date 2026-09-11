import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, type StyleProp, type TextStyle } from 'react-native';

/**
 * A line that changes by turning over rather than being swapped out from under
 * the reader. Everything the table says goes through here, which is most of
 * what makes it feel unhurried.
 */
export function Say({
  text,
  style,
  numberOfLines,
}: {
  text: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}) {
  const fade = useRef(new Animated.Value(1)).current;
  const [shown, setShown] = useState(text);
  const pending = useRef(text);

  useEffect(() => {
    if (text === pending.current) return;
    pending.current = text;

    Animated.timing(fade, {
      toValue: 0,
      duration: 110,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) return;
      setShown(pending.current);
      Animated.timing(fade, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
  }, [text, fade]);

  return (
    <Animated.Text
      numberOfLines={numberOfLines}
      style={[
        style,
        {
          opacity: fade,
          transform: [{ translateY: fade.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) }],
        },
      ]}
    >
      {shown}
    </Animated.Text>
  );
}

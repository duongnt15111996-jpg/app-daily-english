import React, { useRef } from 'react';
import { Pressable, Animated, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, RADIUS, SHADOW } from '../../constants/theme';

interface Props {
  onPress: () => void;
  style?: ViewStyle;
  children: React.ReactNode;
  shadow?: boolean;
}

export default function PressableCard({ onPress, style, children, shadow = true }: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 60, bounciness: 0 }).start();

  const pressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 6 }).start();

  return (
    <Pressable
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      android_ripple={{ color: 'transparent' }}
    >
      <Animated.View style={[styles.card, shadow && SHADOW.sm, style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});

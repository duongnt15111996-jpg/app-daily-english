import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, RADIUS, SHADOW } from '../../constants/theme';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  shadow?: boolean;
}

export default function Card({ children, style, shadow = true }: Props) {
  return (
    <View style={[styles.card, shadow && SHADOW.sm, style]}>
      {children}
    </View>
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

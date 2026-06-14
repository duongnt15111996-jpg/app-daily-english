import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { COLORS } from '../../constants/theme';

interface Props {
  progress: number; // 0–1
  color?: string;
  height?: number;
  backgroundColor?: string;
  style?: ViewStyle;
}

export default function ProgressBar({
  progress,
  color = COLORS.primary,
  height = 6,
  backgroundColor = COLORS.primaryLight,
  style,
}: Props) {
  const clamped = Math.min(1, Math.max(0, progress));
  return (
    <View style={[styles.track, { height, backgroundColor, borderRadius: height }, style]}>
      <View style={[styles.fill, { width: `${clamped * 100}%`, backgroundColor: color, borderRadius: height }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: '100%', overflow: 'hidden' },
  fill: { height: '100%' },
});

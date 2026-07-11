import React, { useEffect, useRef } from 'react';
import { Animated, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../theme';
import { useReducedMotion } from '../hooks/useReducedMotion';

export interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

export function Skeleton({ width = '100%', height = 16, radius, style }: SkeletonProps): React.JSX.Element {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const pulse = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    if (reducedMotion) {
      pulse.setValue(0.5);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.35, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reducedMotion, pulse]);

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        {
          width,
          height,
          borderRadius: radius ?? theme.radius.field,
          backgroundColor: theme.colors.border,
          opacity: pulse,
        },
        style,
      ]}
    />
  );
}

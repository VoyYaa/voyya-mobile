import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { useTheme } from '../../theme';
import { USE_NATIVE_DRIVER, motion } from '../../tokens';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { withAlpha } from '../../utils/color';

export interface RadarPulseProps {
  size: number;
  rings?: 1 | 2 | 3;
  periodMs?: number;
  color?: string;
  active?: boolean;
  fillOpacity?: number;
  strokeOpacity?: number;
  testID?: string;
}

interface PulseRingProps {
  size: number;
  color: string;
  periodMs: number;
  delayMs: number;
  fillOpacity: number;
  strokeOpacity: number;
}

const MIN_SCALE = 0.3;

function PulseRing({
  size,
  color,
  periodMs,
  delayMs,
  fillOpacity,
  strokeOpacity,
}: PulseRingProps): React.JSX.Element {
  const progress = useRef(new Animated.Value(0)).current;
  const gate = useRef(new Animated.Value(delayMs > 0 ? 0 : 1)).current;

  useEffect(() => {
    progress.setValue(0);
    gate.setValue(delayMs > 0 ? 0 : 1);
    const sequence = Animated.sequence([
      Animated.delay(delayMs),
      Animated.timing(gate, { toValue: 1, duration: 0, useNativeDriver: USE_NATIVE_DRIVER }),
      Animated.loop(
        Animated.timing(progress, {
          toValue: 1,
          duration: periodMs,
          easing: motion.ease.out,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ),
    ]);
    sequence.start();
    return () => sequence.stop();
  }, [progress, gate, periodMs, delayMs]);

  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [MIN_SCALE, 1] });
  const fade = progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 2,
        borderColor: withAlpha(color, strokeOpacity),
        backgroundColor: withAlpha(color, fillOpacity),
        opacity: Animated.multiply(fade, gate),
        transform: [{ scale }],
      }}
    />
  );
}

export function RadarPulse({
  size,
  rings = 2,
  periodMs = motion.dur.pulse,
  color,
  active = true,
  fillOpacity = 0.14,
  strokeOpacity = 0.5,
  testID,
}: RadarPulseProps): React.JSX.Element {
  const theme = useTheme();
  const reduced = useReducedMotion();
  const tone = color ?? theme.colors.brand;
  const animate = active && !reduced;

  return (
    <View
      testID={testID}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
    >
      {animate ? (
        Array.from({ length: rings }, (_, index) => (
          <PulseRing
            key={index}
            size={size}
            color={tone}
            periodMs={periodMs}
            delayMs={Math.round((index * periodMs) / rings)}
            fillOpacity={fillOpacity}
            strokeOpacity={strokeOpacity}
          />
        ))
      ) : (
        <View
          style={{
            width: size * 0.8,
            height: size * 0.8,
            borderRadius: size * 0.4,
            borderWidth: 2,
            borderColor: withAlpha(tone, 0.3),
            backgroundColor: withAlpha(tone, 0.12),
          }}
        />
      )}
    </View>
  );
}

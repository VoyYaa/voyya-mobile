import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { USE_NATIVE_DRIVER } from '../tokens';

export interface LoopOptions {
  durationMs: number;
  easing?: (input: number) => number;
  delayMs?: number;
  reverse?: boolean;
}

export function useLoopValue(active: boolean, options: LoopOptions): Animated.Value {
  const value = useRef(new Animated.Value(0)).current;
  const { durationMs, easing = Easing.linear, delayMs = 0, reverse = false } = options;

  useEffect(() => {
    value.setValue(0);
    if (!active) return;

    const legMs = reverse ? durationMs / 2 : durationMs;
    const forward = Animated.timing(value, {
      toValue: 1,
      duration: legMs,
      easing,
      useNativeDriver: USE_NATIVE_DRIVER,
    });
    const cycle = reverse
      ? Animated.sequence([
          forward,
          Animated.timing(value, {
            toValue: 0,
            duration: legMs,
            easing,
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
        ])
      : forward;
    const looped = Animated.loop(cycle);
    const animation = delayMs > 0 ? Animated.sequence([Animated.delay(delayMs), looped]) : looped;
    animation.start();

    return () => animation.stop();
  }, [active, durationMs, easing, delayMs, reverse, value]);

  return value;
}

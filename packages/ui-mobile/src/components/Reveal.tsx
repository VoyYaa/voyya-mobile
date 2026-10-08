import React, { useEffect, useRef } from 'react';
import { Animated, type StyleProp, type ViewStyle } from 'react-native';
import { USE_NATIVE_DRIVER, motion } from '../tokens';
import { useReducedMotion } from '../hooks/useReducedMotion';

export interface RevealProps {
  children: React.ReactNode;
  index?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const TRAVEL_DP = 12;

export function Reveal({ children, index = 0, style, testID }: RevealProps): React.JSX.Element {
  const reduced = useReducedMotion();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const delay = Math.min(index, motion.staggerMax - 1) * motion.stagger;
    const animation = Animated.sequence([
      Animated.delay(reduced ? 0 : delay),
      Animated.timing(progress, {
        toValue: 1,
        duration: reduced ? motion.reducedFadeMs : motion.dur.enter,
        easing: motion.ease.out,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [index, reduced, progress]);

  const translateY = reduced
    ? 0
    : progress.interpolate({ inputRange: [0, 1], outputRange: [TRAVEL_DP, 0] });

  return (
    <Animated.View
      testID={testID}
      style={[style, { opacity: progress, transform: [{ translateY }] }]}
    >
      {children}
    </Animated.View>
  );
}

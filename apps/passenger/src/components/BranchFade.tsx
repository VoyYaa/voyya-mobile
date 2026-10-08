import React, { useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';
import { USE_NATIVE_DRIVER, motion, useReducedMotion } from '@voyyaa/ui-mobile';

export interface BranchFadeProps {
  branchKey: string;
  children: React.ReactNode;
}

const TRAVEL_DP = 12;
const OUT_MS = 100;

export function BranchFade({ branchKey, children }: BranchFadeProps): React.JSX.Element {
  const reduced = useReducedMotion();
  const [committedKey, setCommittedKey] = useState(branchKey);
  const lastNode = useRef(children);
  const opacity = useRef(new Animated.Value(0)).current;
  const travel = useRef(new Animated.Value(TRAVEL_DP)).current;

  if (committedKey === branchKey) lastNode.current = children;

  useEffect(() => {
    if (committedKey === branchKey) return;
    const animation = Animated.timing(opacity, {
      toValue: 0,
      duration: reduced ? 0 : OUT_MS,
      useNativeDriver: USE_NATIVE_DRIVER,
    });
    animation.start(({ finished }) => {
      if (finished) setCommittedKey(branchKey);
    });
    return () => animation.stop();
  }, [branchKey, committedKey, opacity, reduced]);

  useEffect(() => {
    travel.setValue(reduced ? 0 : TRAVEL_DP);
    const animation = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: reduced ? motion.reducedFadeMs : motion.dur.base,
        easing: motion.ease.out,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(travel, {
        toValue: 0,
        duration: reduced ? 0 : motion.dur.base,
        easing: motion.ease.out,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [committedKey, opacity, travel, reduced]);

  return (
    <Animated.View style={{ flex: 1, opacity, transform: [{ translateY: travel }] }}>
      {committedKey === branchKey ? children : lastNode.current}
    </Animated.View>
  );
}

import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { BRAND_COLORS, USE_NATIVE_DRIVER, motion } from '../../tokens';
import { uiCopy } from '../../copy';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useLoopValue } from '../../motion/useLoopValue';
import { BrandMorph, type BrandMorphTarget } from './BrandMorph';

export interface BootScreenProps {
  target: BrandMorphTarget;
  ready: boolean;
  onDone: () => void;
  onFirstFrame?: () => void;
  size?: number;
  maxWaitMs?: number;
  testID?: string;
}

const DEFAULT_SIZE = 200;
const DEFAULT_MAX_WAIT_MS = 3000;
const MIN_WAIT_MS = 120;
const RING_FADE_MS = 150;
const WHEELS_MS = 160;
const FINAL_PAUSE_MS = 80;
const FADE_OUT_MS = 180;
const REDUCED_HOLD_MS = 300;

export function BootScreen({
  target,
  ready,
  onDone,
  onFirstFrame,
  size = DEFAULT_SIZE,
  maxWaitMs = DEFAULT_MAX_WAIT_MS,
  testID = 'boot-screen',
}: BootScreenProps): React.JSX.Element {
  const theme = useTheme();
  const reduced = useReducedMotion();
  const [framePainted, setFramePainted] = useState(false);

  const progress = useRef(new Animated.Value(0)).current;
  const ringOpacity = useRef(new Animated.Value(1)).current;
  const wheelsOpacity = useRef(new Animated.Value(0)).current;
  const rootOpacity = useRef(new Animated.Value(1)).current;

  const paintedAt = useRef<number | null>(null);
  const started = useRef(false);
  const finished = useRef(false);
  const running = useRef<Animated.CompositeAnimation | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const onFirstFrameRef = useRef(onFirstFrame);
  onFirstFrameRef.current = onFirstFrame;
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;

  const breathing = useLoopValue(framePainted && !ready && !reduced, {
    durationMs: 900,
    easing: motion.ease.inOut,
    reverse: true,
  });
  const breathScale = breathing.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] });

  const later = (callback: () => void, delayMs: number): void => {
    timers.current.push(setTimeout(callback, delayMs));
  };

  const finish = (fast: boolean): void => {
    if (finished.current) return;
    finished.current = true;
    running.current?.stop();
    timers.current.forEach(clearTimeout);
    timers.current = [];
    Animated.timing(rootOpacity, {
      toValue: 0,
      duration: fast ? motion.reducedFadeMs : FADE_OUT_MS,
      easing: motion.ease.out,
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start(({ finished: completed }) => {
      if (completed) onDoneRef.current();
    });
  };

  const handleLayout = (): void => {
    if (paintedAt.current !== null) return;
    paintedAt.current = Date.now();
    setFramePainted(true);
    requestAnimationFrame(() => onFirstFrameRef.current?.());
  };

  useEffect(() => {
    if (!framePainted) return;
    const timer = setTimeout(() => {
      if (!started.current) finish(true);
    }, maxWaitMs);
    return () => clearTimeout(timer);
  }, [framePainted, maxWaitMs]);

  useEffect(() => {
    if (!framePainted || !ready || started.current) return;
    started.current = true;
    const elapsed = Date.now() - (paintedAt.current ?? Date.now());
    const wait = Math.max(0, MIN_WAIT_MS - elapsed);

    later(() => {
      if (reducedRef.current) {
        progress.setValue(1);
        ringOpacity.setValue(0);
        wheelsOpacity.setValue(1);
        later(() => finish(true), REDUCED_HOLD_MS);
        return;
      }
      const steps: Animated.CompositeAnimation[] = [
        Animated.parallel([
          Animated.timing(ringOpacity, {
            toValue: 0,
            duration: RING_FADE_MS,
            easing: motion.ease.linear,
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
          Animated.timing(progress, {
            toValue: 1,
            duration: motion.dur.hero,
            easing: motion.ease.inOut,
            useNativeDriver: false,
          }),
        ]),
      ];
      if (target === 'car') {
        steps.push(
          Animated.timing(wheelsOpacity, {
            toValue: 1,
            duration: WHEELS_MS,
            easing: motion.ease.out,
            useNativeDriver: false,
          }),
        );
      }
      steps.push(Animated.delay(FINAL_PAUSE_MS));
      const sequence = Animated.sequence(steps);
      running.current = sequence;
      sequence.start(({ finished: completed }) => {
        if (completed) finish(false);
      });
    }, wait);
  }, [framePainted, ready, target]);

  useEffect(
    () => () => {
      running.current?.stop();
      timers.current.forEach(clearTimeout);
      timers.current = [];
      started.current = false;
      finished.current = false;
    },
    [],
  );

  return (
    <Animated.View
      testID={testID}
      accessibilityRole="progressbar"
      accessibilityLabel={uiCopy.bootLabel}
      accessibilityState={{ busy: true }}
      onLayout={handleLayout}
      onTouchStart={() => {
        if (started.current) finish(reducedRef.current);
      }}
      style={[
        StyleSheet.absoluteFillObject,
        {
          backgroundColor: theme.colors.stage,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: rootOpacity,
          zIndex: 1000,
          elevation: 1000,
        },
      ]}
    >
      <Animated.View style={{ transform: [{ scale: breathScale }] }}>
        <BrandMorph
          target={target}
          progress={progress}
          size={size}
          ringOpacity={ringOpacity}
          wheelsOpacity={wheelsOpacity}
          ringColor={target === 'car' ? BRAND_COLORS.go : BRAND_COLORS.amber}
        />
      </Animated.View>
    </Animated.View>
  );
}

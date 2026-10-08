import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { BRAND_COLORS, USE_NATIVE_DRIVER, motion } from '../../tokens';
import { uiCopy } from '../../copy';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { BrandHop } from './BrandHop';
import type { BrandMorphTarget } from './BrandMorph';

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
const SETTLE_HOLD_MS = 260;
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

  const rootOpacity = useRef(new Animated.Value(1)).current;

  const painted = useRef(false);
  const started = useRef(false);
  const finished = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const onFirstFrameRef = useRef(onFirstFrame);
  onFirstFrameRef.current = onFirstFrame;
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;

  const later = (callback: () => void, delayMs: number): void => {
    timers.current.push(setTimeout(callback, delayMs));
  };

  const finish = (fast: boolean): void => {
    if (finished.current) return;
    finished.current = true;
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
    if (painted.current) return;
    painted.current = true;
    setFramePainted(true);
    requestAnimationFrame(() => onFirstFrameRef.current?.());
  };

  const handleSettled = (): void => {
    const fast = reducedRef.current;
    later(() => finish(fast), fast ? REDUCED_HOLD_MS : SETTLE_HOLD_MS);
  };

  useEffect(() => {
    if (!framePainted) return;
    const timer = setTimeout(() => {
      if (!started.current) finish(true);
    }, maxWaitMs);
    return () => clearTimeout(timer);
  }, [framePainted, maxWaitMs]);

  useEffect(() => {
    if (framePainted && ready) started.current = true;
  }, [framePainted, ready]);

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
      painted.current = false;
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
      <BrandHop
        target={target}
        size={size}
        loop={!ready}
        active={framePainted}
        onSettled={handleSettled}
        ringColor={target === 'car' ? BRAND_COLORS.go : BRAND_COLORS.amber}
        gapColor={theme.colors.stage}
      />
    </Animated.View>
  );
}

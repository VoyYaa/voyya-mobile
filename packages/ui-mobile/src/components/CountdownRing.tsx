import React, { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTheme } from '../theme';
import { USE_NATIVE_DRIVER, motion } from '../tokens';
import { uiCopy } from '../copy';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { withAlpha } from '../utils/color';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

export type CountdownRingStatus = 'counting' | 'frozen' | 'success' | 'expired';
export type CountdownRingTone = 'default' | 'onStage';

export interface CountdownRingProps {
  durationSec: number;
  remainingSec: number;
  status: CountdownRingStatus;
  warnThresholdSec?: number;
  reducedMotion?: boolean;
  onExpire?: () => void;
  size?: number;
  tone?: CountdownRingTone;
  dimmed?: boolean;
  testID?: string;
}

const DEFAULT_SIZE = 168;
const STROKE_WIDTH = 12;
const HEAD_SIZE = 14;
const ANIM_DURATION_MS = 260;
const SUCCESS_ARC_MS = 320;
const POP_HALF_MS = 90;
const WAVE_MS = 600;
const SUCCESS_WAVE_MS = 500;
const SHAKE_STEP_MS = 60;
const CHECK_PATH = 'M18 33 L28 43 L46 22';
const CHECK_LENGTH = 42;

export function CountdownRing({
  durationSec,
  remainingSec,
  status,
  warnThresholdSec = 5,
  reducedMotion = false,
  onExpire,
  size = DEFAULT_SIZE,
  tone = 'default',
  dimmed = false,
  testID,
}: CountdownRingProps): React.JSX.Element {
  const theme = useTheme();
  const { colors } = theme;
  const hookReduced = useReducedMotion();
  const reduced = reducedMotion || hookReduced;
  const onStage = tone === 'onStage';

  const radius = (size - STROKE_WIDTH) / 2;
  const circumference = 2 * Math.PI * radius;
  const safeDuration = Math.max(1, durationSec);
  const clampedRemaining = Math.min(safeDuration, Math.max(0, Math.round(remainingSec)));
  const progress = clampedRemaining / safeDuration;
  const isWarn = clampedRemaining <= warnThresholdSec;
  const arcTarget = status === 'success' ? 1 : status === 'expired' ? 0 : progress;

  const animatedProgress = useRef(new Animated.Value(arcTarget)).current;
  const headProgress = useRef(new Animated.Value(arcTarget)).current;
  const checkProgress = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(0)).current;
  const wave = useRef(new Animated.Value(1)).current;
  const shake = useRef(new Animated.Value(0)).current;
  const expireFired = useRef(false);
  const warnAnnounced = useRef(false);
  const previousRemaining = useRef<number | null>(null);

  useEffect(() => {
    if (reduced) {
      animatedProgress.setValue(arcTarget);
      headProgress.setValue(arcTarget);
      return;
    }
    const duration = status === 'success' ? SUCCESS_ARC_MS : ANIM_DURATION_MS;
    const arc = Animated.timing(animatedProgress, {
      toValue: arcTarget,
      duration,
      useNativeDriver: false,
    });
    const head = Animated.timing(headProgress, {
      toValue: arcTarget,
      duration,
      useNativeDriver: USE_NATIVE_DRIVER,
    });
    arc.start();
    head.start();
    return () => {
      arc.stop();
      head.stop();
    };
  }, [arcTarget, status, reduced, animatedProgress, headProgress]);

  useEffect(() => {
    const previous = previousRemaining.current;
    previousRemaining.current = clampedRemaining;
    if (status !== 'counting' || reduced || previous === null || previous === clampedRemaining) {
      return;
    }
    pop.setValue(0);
    wave.setValue(0);
    const beat = Animated.sequence([
      Animated.timing(pop, {
        toValue: 1,
        duration: POP_HALF_MS,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(pop, {
        toValue: 0,
        duration: POP_HALF_MS,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]);
    const ripple = Animated.timing(wave, {
      toValue: 1,
      duration: WAVE_MS,
      easing: motion.ease.out,
      useNativeDriver: USE_NATIVE_DRIVER,
    });
    beat.start();
    ripple.start();
    return () => {
      beat.stop();
      ripple.stop();
    };
  }, [clampedRemaining, status, reduced, pop, wave]);

  useEffect(() => {
    if (status !== 'success') {
      checkProgress.setValue(0);
      return;
    }
    if (reduced) {
      checkProgress.setValue(1);
      return;
    }
    wave.setValue(0);
    const check = Animated.timing(checkProgress, {
      toValue: 1,
      duration: SUCCESS_ARC_MS,
      easing: motion.ease.out,
      useNativeDriver: false,
    });
    const ripple = Animated.timing(wave, {
      toValue: 1,
      duration: SUCCESS_WAVE_MS,
      easing: motion.ease.out,
      useNativeDriver: USE_NATIVE_DRIVER,
    });
    check.start();
    ripple.start();
    return () => {
      check.stop();
      ripple.stop();
    };
  }, [status, reduced, checkProgress, wave]);

  useEffect(() => {
    if (status !== 'expired' || reduced) return;
    const animation = Animated.sequence([
      Animated.timing(shake, {
        toValue: 1,
        duration: SHAKE_STEP_MS,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(shake, {
        toValue: -1,
        duration: SHAKE_STEP_MS,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(shake, {
        toValue: 1,
        duration: SHAKE_STEP_MS,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(shake, {
        toValue: 0,
        duration: SHAKE_STEP_MS,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [status, reduced, shake]);

  useEffect(() => {
    if (status === 'counting' && remainingSec <= 0 && !expireFired.current) {
      expireFired.current = true;
      onExpire?.();
    }
  }, [remainingSec, status, onExpire]);

  useEffect(() => {
    if (status !== 'counting') return;
    if (isWarn && !warnAnnounced.current) {
      warnAnnounced.current = true;
      AccessibilityInfo.announceForAccessibility(`${clampedRemaining} ${uiCopy.secondsToRespond}`);
    } else if (!isWarn) {
      warnAnnounced.current = false;
    }
  }, [isWarn, status, clampedRemaining]);

  const strokeDashoffset = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });
  const headRotation = headProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const checkOffset = checkProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [CHECK_LENGTH, 0],
  });
  const popScale = pop.interpolate({
    inputRange: [0, 1],
    outputRange: [1, isWarn ? 1.2 : 1.12],
  });
  const waveScale = wave.interpolate({ inputRange: [0, 1], outputRange: [1, 1.25] });
  const waveOpacity = wave.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0] });
  const shakeX = shake.interpolate({ inputRange: [-1, 0, 1], outputRange: [-6, 0, 6] });

  const warnColor = onStage ? colors.danger : colors.dangerInk;
  const arcColor =
    status === 'success'
      ? colors.success
      : isWarn || status === 'expired'
        ? colors.danger
        : colors.brand;
  const waveColor = status === 'success' ? colors.success : isWarn ? colors.danger : colors.brand;
  const trackColor = onStage ? colors.stageLine : colors.border;
  const numberColor =
    status === 'expired' || (status === 'counting' && isWarn)
      ? warnColor
      : onStage
        ? colors.onStage
        : colors.text;
  const labelColor = onStage ? colors.onStageMuted : colors.textMuted;
  const checkColor = onStage ? colors.success : colors.successInk;
  const showHead = status === 'counting' || status === 'frozen';
  const numberSize = Math.round(size * 0.29);
  const arcOpacity = dimmed ? 0.3 : 1;

  return (
    <View
      testID={testID}
      accessible
      accessibilityRole="timer"
      aria-valuemin={0}
      aria-valuemax={safeDuration}
      aria-valuenow={clampedRemaining}
      aria-valuetext={
        status === 'success'
          ? uiCopy.accepted
          : status === 'expired'
            ? uiCopy.timeUp
            : `${clampedRemaining} ${uiCopy.secondsToRespond}`
      }
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
    >
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 2,
          borderColor: withAlpha(waveColor, 0.6),
          backgroundColor: withAlpha(waveColor, 0.08),
          opacity: waveOpacity,
          transform: [{ scale: waveScale }],
        }}
      />
      <Animated.View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          transform: [{ translateX: shakeX }, { rotate: '-90deg' }],
          opacity: arcOpacity,
        }}
      >
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={trackColor}
            strokeWidth={STROKE_WIDTH}
            fill="none"
          />
          {status !== 'expired' && (
            <AnimatedCircle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={arcColor}
              strokeWidth={STROKE_WIDTH}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              fill="none"
            />
          )}
        </Svg>
      </Animated.View>
      {showHead && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            width: size,
            height: size,
            opacity: arcOpacity,
            transform: [{ rotate: headRotation }],
          }}
        >
          <View
            style={{
              position: 'absolute',
              top: STROKE_WIDTH / 2 - HEAD_SIZE / 2,
              left: size / 2 - HEAD_SIZE / 2,
              width: HEAD_SIZE,
              height: HEAD_SIZE,
              borderRadius: HEAD_SIZE / 2,
              backgroundColor: onStage ? colors.onStage : colors.text,
            }}
          />
        </Animated.View>
      )}

      {status === 'success' ? (
        <View accessibilityElementsHidden>
          <Svg width={size * 0.4} height={size * 0.4} viewBox="0 0 64 64">
            <AnimatedPath
              d={CHECK_PATH}
              stroke={checkColor}
              strokeWidth={6}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={CHECK_LENGTH}
              strokeDashoffset={checkOffset}
              fill="none"
            />
          </Svg>
        </View>
      ) : (
        <Animated.View
          accessibilityElementsHidden
          style={{ alignItems: 'center', transform: [{ scale: popScale }] }}
        >
          <Text
            style={{
              ...theme.typography.timer,
              fontSize: numberSize,
              lineHeight: numberSize,
              color: numberColor,
            }}
          >
            {clampedRemaining}
          </Text>
          <Text style={{ ...theme.typography.small, color: labelColor }}>{uiCopy.seconds}</Text>
        </Animated.View>
      )}
    </View>
  );
}

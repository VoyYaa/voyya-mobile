import React, { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export type CountdownRingStatus = 'counting' | 'frozen' | 'success' | 'expired';

export interface CountdownRingProps {
  durationSec: number;
  remainingSec: number;
  status: CountdownRingStatus;
  warnThresholdSec?: number;
  reducedMotion?: boolean;
  onExpire?: () => void;
  size?: number;
  testID?: string;
}

const DEFAULT_SIZE = 168;
const STROKE_WIDTH = 10;
const ANIM_DURATION_MS = 260;

export function CountdownRing({
  durationSec,
  remainingSec,
  status,
  warnThresholdSec = 5,
  reducedMotion = false,
  onExpire,
  size = DEFAULT_SIZE,
  testID,
}: CountdownRingProps): React.JSX.Element {
  const theme = useTheme();
  const radius = (size - STROKE_WIDTH) / 2;
  const circumference = 2 * Math.PI * radius;
  const safeDuration = Math.max(1, durationSec);
  const clampedRemaining = Math.min(safeDuration, Math.max(0, Math.round(remainingSec)));
  const progress = clampedRemaining / safeDuration;
  const isWarn = clampedRemaining <= warnThresholdSec;

  const animatedProgress = useRef(new Animated.Value(progress)).current;
  const expireFired = useRef(false);
  const warnAnnounced = useRef(false);

  useEffect(() => {
    if (reducedMotion) {
      animatedProgress.setValue(progress);
      return;
    }
    const anim = Animated.timing(animatedProgress, {
      toValue: progress,
      duration: ANIM_DURATION_MS,
      useNativeDriver: false,
    });
    anim.start();
    return () => anim.stop();
  }, [progress, reducedMotion, animatedProgress]);

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
      AccessibilityInfo.announceForAccessibility(`${clampedRemaining} segundos para responder`);
    } else if (!isWarn) {
      warnAnnounced.current = false;
    }
  }, [isWarn, status, clampedRemaining]);

  const strokeDashoffset = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  const showProgressArc = status !== 'expired';
  const ringColor = isWarn || status === 'expired' ? theme.colors.danger : theme.colors.brand;
  const numberColor = status === 'expired' ? theme.colors.danger : theme.colors.text;

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
          ? 'Solicitud aceptada'
          : status === 'expired'
            ? 'Tiempo agotado'
            : `${clampedRemaining} segundos para responder`
      }
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
    >
      <Svg
        width={size}
        height={size}
        style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}
      >
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.colors.border}
          strokeWidth={STROKE_WIDTH}
          fill="none"
        />
        {showProgressArc && (
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={ringColor}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            fill="none"
          />
        )}
        {status === 'expired' && (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={theme.colors.danger}
            strokeWidth={STROKE_WIDTH}
            fill="none"
          />
        )}
      </Svg>

      {status === 'success' ? (
        <Text
          accessibilityElementsHidden
          style={{ fontSize: 48, fontWeight: '700', color: theme.colors.success }}
        >
          ✓
        </Text>
      ) : (
        <View accessibilityElementsHidden style={{ alignItems: 'center' }}>
          <Text style={{ ...theme.typography.numeric, fontSize: 40, color: numberColor }}>
            {clampedRemaining}
          </Text>
          <Text style={{ ...theme.typography.small, color: theme.colors.textMuted }}>seg</Text>
        </View>
      )}
    </View>
  );
}

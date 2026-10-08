import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, View } from 'react-native';
import { useTheme } from '../theme';
import { USE_NATIVE_DRIVER, motion } from '../tokens';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { LinkButton } from './LinkButton';

export type ToastTone = 'neutral' | 'success' | 'danger' | 'info';

export interface ToastProps {
  message: string;
  tone?: ToastTone;
  visible: boolean;
  onHide: () => void;
  durationMs?: number;
  actionLabel?: string;
  onAction?: () => void;
  bottomOffset?: number;
  testID?: string;
}

const DEFAULT_DURATION_MS = 2200;
const ACTION_DURATION_MS = 4000;
const RAIL_WIDTH = 4;
const DOT_SIZE = 8;
const ENTER_TRAVEL_DP = 16;

export function Toast({
  message,
  tone = 'neutral',
  visible,
  onHide,
  durationMs,
  actionLabel,
  onAction,
  bottomOffset = 0,
  testID,
}: ToastProps): React.JSX.Element | null {
  const theme = useTheme();
  const reduced = useReducedMotion();
  const [rendered, setRendered] = useState(visible);
  const progress = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const onHideRef = useRef(onHide);
  onHideRef.current = onHide;
  const holdMs = durationMs ?? (actionLabel ? ACTION_DURATION_MS : DEFAULT_DURATION_MS);

  useEffect(() => {
    if (visible) {
      setRendered(true);
      const enter = Animated.timing(progress, {
        toValue: 1,
        duration: reduced ? motion.reducedFadeMs : motion.dur.enter,
        easing: motion.ease.out,
        useNativeDriver: USE_NATIVE_DRIVER,
      });
      enter.start();
      return () => enter.stop();
    }
    const exit = Animated.timing(progress, {
      toValue: 0,
      duration: reduced ? motion.reducedFadeMs : motion.dur.base,
      easing: motion.ease.out,
      useNativeDriver: USE_NATIVE_DRIVER,
    });
    exit.start(({ finished }) => {
      if (finished) setRendered(false);
    });
    return () => exit.stop();
  }, [visible, reduced, progress]);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => onHideRef.current(), holdMs);
    return () => clearTimeout(timer);
  }, [visible, holdMs]);

  if (!rendered) return null;

  const { colors } = theme;
  const toneColors: Record<ToastTone, string> = {
    neutral: colors.borderStrong,
    success: colors.success,
    danger: colors.danger,
    info: colors.info,
  };
  const accent = toneColors[tone];
  const translateY = reduced
    ? 0
    : progress.interpolate({ inputRange: [0, 1], outputRange: [ENTER_TRAVEL_DP, 0] });

  return (
    <Animated.View
      testID={testID}
      accessibilityLiveRegion={tone === 'danger' ? 'assertive' : 'polite'}
      style={{
        position: 'absolute',
        left: theme.spacing.lg,
        right: theme.spacing.lg,
        bottom: theme.spacing.xxl + bottomOffset,
        opacity: progress,
        transform: [{ translateY }],
        backgroundColor: colors.surfaceRaised,
        borderRadius: theme.radius.button,
        ...theme.shadow.md,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          overflow: 'hidden',
          borderRadius: theme.radius.button,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <View style={{ width: RAIL_WIDTH, backgroundColor: accent }} />
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.spacing.md,
            paddingVertical: theme.spacing.md,
            paddingHorizontal: theme.spacing.lg,
          }}
        >
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={{
              width: DOT_SIZE,
              height: DOT_SIZE,
              borderRadius: DOT_SIZE / 2,
              backgroundColor: accent,
            }}
          />
          <Text
            numberOfLines={2}
            style={{ ...theme.typography.bodyStrong, color: colors.text, flex: 1 }}
          >
            {message}
          </Text>
          {actionLabel && onAction && <LinkButton label={actionLabel} onPress={onAction} />}
        </View>
      </View>
    </Animated.View>
  );
}

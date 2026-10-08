import React from 'react';
import { Animated, Text, View } from 'react-native';
import { useTheme } from '../theme';
import { motion } from '../tokens';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useLoopValue } from '../motion/useLoopValue';
import type { StatusTone } from '../utils/trip-status-tone';

export type StatusBadgeTone = StatusTone | 'go' | 'warn';

export interface StatusBadgeProps {
  label: string;
  tone: StatusBadgeTone;
  pulse?: boolean;
  testID?: string;
}

const LEGACY_ALIAS: Record<'go' | 'warn', StatusTone> = { go: 'success', warn: 'warning' };
const DOT_SIZE = 8;

export function StatusBadge({
  label,
  tone,
  pulse = false,
  testID,
}: StatusBadgeProps): React.JSX.Element {
  const theme = useTheme();
  const reduced = useReducedMotion();
  const { colors } = theme;
  const beat = useLoopValue(pulse && !reduced, {
    durationMs: 1200,
    easing: motion.ease.inOut,
    reverse: true,
  });
  const dotScale =
    pulse && !reduced ? beat.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) : 1;

  const resolved: StatusTone = tone === 'go' || tone === 'warn' ? LEGACY_ALIAS[tone] : tone;

  const palettes: Record<StatusTone, { bg: string; fg: string; dot: string }> = {
    brand: { bg: colors.brandTint, fg: colors.brandInk, dot: colors.brand },
    success: { bg: colors.successTint, fg: colors.successInk, dot: colors.success },
    danger: { bg: colors.dangerTint, fg: colors.dangerInk, dot: colors.danger },
    info: { bg: colors.infoTint, fg: colors.infoInk, dot: colors.info },
    neutral: { bg: colors.surfaceSunken, fg: colors.textMuted, dot: colors.textSubtle },
    strong: { bg: colors.stage, fg: colors.onStage, dot: colors.onStage },
    warning: { bg: colors.warningTint, fg: colors.warningInk, dot: colors.brand },
  };
  const palette = palettes[resolved];

  return (
    <View
      testID={testID}
      accessible
      accessibilityLabel={label}
      style={{
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: palette.bg,
        borderRadius: theme.radius.pill,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        gap: theme.spacing.sm,
      }}
    >
      <Animated.View
        style={{
          width: DOT_SIZE,
          height: DOT_SIZE,
          borderRadius: DOT_SIZE / 2,
          backgroundColor: palette.dot,
          transform: [{ scale: dotScale }],
        }}
      />
      <Text
        maxFontSizeMultiplier={1.3}
        style={{ ...theme.typography.smallStrong, color: palette.fg }}
      >
        {label}
      </Text>
    </View>
  );
}

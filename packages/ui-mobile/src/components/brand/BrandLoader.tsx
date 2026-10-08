import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Pressable, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../../theme';
import { BRAND_COLORS, motion } from '../../tokens';
import { uiCopy } from '../../copy';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useLoopValue } from '../../motion/useLoopValue';
import { RadarPulse } from './RadarPulse';

export type BrandLoaderVariant = 'screen' | 'overlay';
export type BrandLoaderSize = 'md' | 'lg' | 'xl';

export interface BrandLoaderProps {
  variant?: BrandLoaderVariant;
  size?: BrandLoaderSize;
  label?: string;
  onCancel?: () => void;
  testID?: string;
}

const BOX_SIZE: Record<BrandLoaderSize, number> = { md: 64, lg: 96, xl: 144 };
const SLOW_LABEL_MS = 4000;
const OVERLAY_TIMEOUT_MS = 12000;
const OVERLAY_VEIL = 'rgba(42, 32, 24, 0.45)';

interface LoaderMarkProps {
  box: number;
}

function LoaderMark({ box }: LoaderMarkProps): React.JSX.Element {
  const reduced = useReducedMotion();
  const breathing = useLoopValue(!reduced, {
    durationMs: 1200,
    easing: motion.ease.inOut,
    reverse: true,
  });
  const dotScale = reduced
    ? 1
    : breathing.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] });
  const unit = box / 160;

  return (
    <View style={{ width: box, height: box, alignItems: 'center', justifyContent: 'center' }}>
      <RadarPulse
        size={box * 0.8}
        rings={2}
        periodMs={motion.dur.pulse}
        color={BRAND_COLORS.amber}
      />
      <View style={{ position: 'absolute', width: box, height: box }}>
        <Svg width={box} height={box} viewBox="0 0 160 160">
          <Circle
            cx={80}
            cy={80}
            r={36}
            stroke={BRAND_COLORS.amber}
            strokeOpacity={0.65}
            strokeWidth={4}
            fill="none"
          />
        </Svg>
      </View>
      <Animated.View
        style={{
          position: 'absolute',
          width: 44 * unit,
          height: 44 * unit,
          borderRadius: 22 * unit,
          backgroundColor: BRAND_COLORS.amber,
          transform: [{ scale: dotScale }],
        }}
      />
    </View>
  );
}

function useElapsedFlags(): { slow: boolean; timedOut: boolean } {
  const [slow, setSlow] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const slowTimer = setTimeout(() => setSlow(true), SLOW_LABEL_MS);
    const timeoutTimer = setTimeout(() => setTimedOut(true), OVERLAY_TIMEOUT_MS);
    return () => {
      clearTimeout(slowTimer);
      clearTimeout(timeoutTimer);
    };
  }, []);

  return { slow, timedOut };
}

export function BrandLoader({
  variant = 'screen',
  size,
  label,
  onCancel,
  testID = 'brand-loader',
}: BrandLoaderProps): React.JSX.Element {
  const theme = useTheme();
  const { slow, timedOut } = useElapsedFlags();
  const isOverlay = variant === 'overlay';
  const box = BOX_SIZE[size ?? (isOverlay ? 'md' : 'xl')];
  const baseLabel = label ?? uiCopy.loading;
  const shownLabel =
    timedOut && isOverlay ? uiCopy.loadingTakesLonger : slow ? uiCopy.stillLoading : baseLabel;

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(baseLabel);
  }, [baseLabel]);

  const labelColor = isOverlay ? theme.colors.textMuted : theme.colors.onStageMuted;

  const content = (
    <View style={{ alignItems: 'center', gap: theme.spacing.lg }}>
      <LoaderMark box={box} />
      <Text
        accessibilityLiveRegion="polite"
        style={{ ...theme.typography.body, color: labelColor, textAlign: 'center' }}
      >
        {shownLabel}
      </Text>
      {isOverlay && timedOut && onCancel && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={uiCopy.cancel}
          onPress={onCancel}
          style={{
            minHeight: theme.touch.min,
            minWidth: theme.touch.min,
            paddingHorizontal: theme.spacing.lg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ ...theme.typography.button, color: theme.colors.text }}>
            {uiCopy.cancel}
          </Text>
        </Pressable>
      )}
    </View>
  );

  if (isOverlay) {
    return (
      <View
        testID={testID}
        accessibilityViewIsModal
        accessibilityRole="progressbar"
        accessibilityLabel={baseLabel}
        accessibilityState={{ busy: true }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: OVERLAY_VEIL,
        }}
      >
        <View
          style={{
            backgroundColor: theme.colors.surfaceRaised,
            borderRadius: theme.radius.card,
            padding: theme.spacing.xl,
            minWidth: 160,
            alignItems: 'center',
            ...theme.shadow.lg,
          }}
        >
          {content}
        </View>
      </View>
    );
  }

  return (
    <View
      testID={testID}
      accessibilityRole="progressbar"
      accessibilityLabel={baseLabel}
      accessibilityState={{ busy: true }}
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.stage,
      }}
    >
      {content}
    </View>
  );
}

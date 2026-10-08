import React, { useEffect, useState } from 'react';
import {
  Animated,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useTheme } from '../theme';
import { BRAND_COLORS } from '../tokens';
import { uiCopy } from '../copy';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { acquireShimmerClock, shimmerClock } from '../motion/shimmer-clock';
import { Card } from './Card';

export interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  accent?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const BAND_RATIO = 0.55;
const ACCENT_SIZE = 8;
const ACCENT_OFFSET = 10;

interface BoxSize {
  width: number;
  height: number;
}

export function Skeleton({
  width = '100%',
  height = 16,
  radius,
  accent = false,
  style,
  testID,
}: SkeletonProps): React.JSX.Element {
  const theme = useTheme();
  const reduced = useReducedMotion();
  const [box, setBox] = useState<BoxSize>({ width: 0, height: 0 });
  const isDark = theme.mode === 'dark';

  useEffect(() => {
    if (reduced) return;
    return acquireShimmerClock();
  }, [reduced]);

  const handleLayout = (event: LayoutChangeEvent): void => {
    const { width: measuredWidth, height: measuredHeight } = event.nativeEvent.layout;
    setBox({ width: measuredWidth, height: measuredHeight });
  };

  const bandWidth = box.width * BAND_RATIO;
  const translateX = shimmerClock.interpolate({
    inputRange: [0, 1],
    outputRange: [-bandWidth, box.width + bandWidth * 0.55],
  });
  const accentScale = shimmerClock.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.8, 1, 0.8],
  });
  const shimmerColor = isDark ? BRAND_COLORS.amber : BRAND_COLORS.amberTint;
  const shimmerOpacity = isDark ? 0.14 : 0.9;

  return (
    <View
      testID={testID}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      onLayout={handleLayout}
      style={[
        {
          width,
          height,
          borderRadius: radius ?? theme.radius.field,
          backgroundColor: isDark ? theme.colors.surface : theme.colors.surfaceSunken,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {!reduced && box.width > 0 && (
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: bandWidth,
            height: box.height,
            transform: [{ translateX }],
          }}
        >
          <Svg width={bandWidth} height={box.height}>
            <Defs>
              <LinearGradient id="vy-skeleton-shimmer" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor={shimmerColor} stopOpacity={0} />
                <Stop offset="0.5" stopColor={shimmerColor} stopOpacity={shimmerOpacity} />
                <Stop offset="1" stopColor={shimmerColor} stopOpacity={0} />
              </LinearGradient>
            </Defs>
            <Rect
              x="0"
              y="0"
              width={bandWidth}
              height={box.height}
              fill="url(#vy-skeleton-shimmer)"
            />
          </Svg>
        </Animated.View>
      )}
      {accent && (
        <Animated.View
          style={{
            position: 'absolute',
            top: ACCENT_OFFSET,
            left: ACCENT_OFFSET,
            width: ACCENT_SIZE,
            height: ACCENT_SIZE,
            borderRadius: ACCENT_SIZE / 2,
            backgroundColor: theme.colors.brand,
            transform: [{ scale: reduced ? 1 : accentScale }],
          }}
        />
      )}
    </View>
  );
}

export interface SkeletonPresetProps {
  accent?: boolean;
}

export function SkeletonRow({ accent = false }: SkeletonPresetProps): React.JSX.Element {
  const theme = useTheme();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
      <Skeleton width={44} height={44} radius={22} accent={accent} />
      <View style={{ flex: 1, gap: theme.spacing.sm }}>
        <Skeleton width="60%" height={16} />
        <Skeleton width="85%" height={14} />
      </View>
    </View>
  );
}

export interface SkeletonCardProps extends SkeletonPresetProps {
  height?: number;
}

export function SkeletonCard({
  height = 120,
  accent = false,
}: SkeletonCardProps): React.JSX.Element {
  const theme = useTheme();
  return <Skeleton height={height} radius={theme.radius.card} accent={accent} />;
}

export function SkeletonRequest({ accent = false }: SkeletonPresetProps): React.JSX.Element {
  const theme = useTheme();

  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
        <Skeleton width={44} height={44} radius={22} accent={accent} />
        <View style={{ flex: 1, gap: theme.spacing.sm }}>
          <Skeleton width="60%" height={16} />
          <Skeleton width="85%" height={14} />
        </View>
        <Skeleton width={56} height={20} />
      </View>
    </Card>
  );
}

export type SkeletonListVariant = 'request' | 'row' | 'card';

export interface SkeletonListProps {
  count?: number;
  variant?: SkeletonListVariant;
}

export function SkeletonList({
  count = 3,
  variant = 'request',
}: SkeletonListProps): React.JSX.Element {
  const theme = useTheme();

  return (
    <View
      accessible
      accessibilityLabel={uiCopy.loading}
      accessibilityState={{ busy: true }}
      style={{ gap: theme.spacing.md }}
    >
      {Array.from({ length: count }, (_, index) => {
        const accent = index === 0;
        if (variant === 'row') return <SkeletonRow key={index} accent={accent} />;
        if (variant === 'card') return <SkeletonCard key={index} accent={accent} />;
        return <SkeletonRequest key={index} accent={accent} />;
      })}
    </View>
  );
}

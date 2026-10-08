import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { useTheme } from '../../theme';
import { motion } from '../../tokens';
import { useReducedMotion } from '../../hooks/useReducedMotion';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedG = Animated.createAnimatedComponent(G);

export type MarkGlyphName = 'empty' | 'clock' | 'error' | 'offline' | 'success' | 'pin' | 'search';

export interface MarkGlyphProps {
  glyph: MarkGlyphName;
  size?: number;
  animate?: boolean;
  color?: string;
  testID?: string;
}

const RING_RADIUS = 24;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const DASHED_RING_GLYPHS: readonly MarkGlyphName[] = ['empty', 'pin', 'error'];

function useGlyphColor(glyph: MarkGlyphName, override?: string): string {
  const { colors } = useTheme();
  if (override) return override;
  const byGlyph: Record<MarkGlyphName, string> = {
    empty: colors.textSubtle,
    clock: colors.brandInk,
    error: colors.dangerInk,
    offline: colors.infoInk,
    success: colors.successInk,
    pin: colors.brandInk,
    search: colors.brandInk,
  };
  return byGlyph[glyph];
}

function GlyphDetails({
  glyph,
  color,
}: {
  glyph: MarkGlyphName;
  color: string;
}): React.JSX.Element {
  switch (glyph) {
    case 'empty':
      return <Circle cx={32} cy={32} r={9} fill={color} fillOpacity={0.45} />;
    case 'clock':
      return (
        <Path
          d="M32 20 V32 L40 37"
          stroke={color}
          strokeWidth={4}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      );
    case 'error':
      return (
        <>
          <Path d="M32 22 V35" stroke={color} strokeWidth={4} strokeLinecap="round" fill="none" />
          <Circle cx={32} cy={42} r={2.5} fill={color} />
        </>
      );
    case 'offline':
      return (
        <>
          <Path
            d="M16 16 L48 48"
            stroke={color}
            strokeWidth={4}
            strokeLinecap="round"
            fill="none"
          />
          <Circle cx={32} cy={32} r={9} fill={color} fillOpacity={0.45} />
        </>
      );
    case 'success':
      return (
        <Path
          d="M21 33 L29 41 L44 24"
          stroke={color}
          strokeWidth={5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      );
    case 'pin':
      return (
        <>
          <Path
            d="M32 18 a8 8 0 0 1 8 8 c0 7 -8 15 -8 15 s-8 -8 -8 -15 a8 8 0 0 1 8 -8 Z"
            stroke={color}
            strokeWidth={3}
            strokeLinejoin="round"
            fill="none"
          />
          <Circle cx={32} cy={26} r={2.5} fill={color} />
        </>
      );
    case 'search':
      return (
        <>
          <Circle cx={30} cy={30} r={8} stroke={color} strokeWidth={4} fill="none" />
          <Path
            d="M36 36 L44 44"
            stroke={color}
            strokeWidth={4}
            strokeLinecap="round"
            fill="none"
          />
        </>
      );
  }
}

export function MarkGlyph({
  glyph,
  size = 64,
  animate = false,
  color,
  testID,
}: MarkGlyphProps): React.JSX.Element {
  const reduced = useReducedMotion();
  const tone = useGlyphColor(glyph, color);
  const shouldAnimate = animate && !reduced;
  const progress = useRef(new Animated.Value(shouldAnimate ? 0 : 1)).current;

  useEffect(() => {
    if (!shouldAnimate) {
      progress.setValue(1);
      return;
    }
    progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: motion.dur.draw,
      easing: motion.ease.out,
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [shouldAnimate, progress, glyph]);

  const dashed = DASHED_RING_GLYPHS.includes(glyph);
  const ringDashOffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [RING_CIRCUMFERENCE, 0],
  });
  const detailsOpacity = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
    easing: Easing.linear,
  });

  return (
    <View
      testID={testID}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: size, height: size }}
    >
      <Svg width={size} height={size} viewBox="0 0 64 64">
        {dashed ? (
          <Circle
            cx={32}
            cy={32}
            r={RING_RADIUS}
            stroke={tone}
            strokeWidth={4}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={glyph === 'error' ? '113 38' : '5 7'}
            rotation={glyph === 'error' ? -60 : 0}
            originX={32}
            originY={32}
          />
        ) : (
          <AnimatedCircle
            cx={32}
            cy={32}
            r={RING_RADIUS}
            stroke={tone}
            strokeWidth={4}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={ringDashOffset}
            rotation={-90}
            originX={32}
            originY={32}
          />
        )}
        <AnimatedG opacity={detailsOpacity}>
          <GlyphDetails glyph={glyph} color={tone} />
        </AnimatedG>
      </Svg>
    </View>
  );
}

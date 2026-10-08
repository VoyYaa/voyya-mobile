import React from 'react';
import { Animated, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../../theme';
import { motion } from '../../tokens';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useLoopValue } from '../../motion/useLoopValue';

export type BrandSpinnerSize = 16 | 20 | 24 | 32;
export type BrandSpinnerTone = 'onBrand' | 'onLight' | 'onDark' | 'onGhost';

export interface BrandSpinnerProps {
  size?: BrandSpinnerSize;
  tone?: BrandSpinnerTone;
  color?: string;
  testID?: string;
}

const ARC_RADIUS = 18;
const ARC_LENGTH = 28.3;
const ARC_GAP = 84.8;

export function BrandSpinner({
  size = 20,
  tone = 'onLight',
  color,
  testID = 'brand-spinner',
}: BrandSpinnerProps): React.JSX.Element {
  const theme = useTheme();
  const reduced = useReducedMotion();
  const rotation = useLoopValue(!reduced, { durationMs: motion.dur.spin });
  const breathing = useLoopValue(!reduced, {
    durationMs: motion.dur.spin,
    easing: motion.ease.inOut,
    reverse: true,
  });

  const toneColors: Record<BrandSpinnerTone, string> = {
    onBrand: theme.colors.onBrand,
    onLight: theme.colors.brandInk,
    onDark: theme.colors.brand,
    onGhost: theme.colors.text,
  };
  const stroke = color ?? toneColors[tone];

  const rotate = reduced
    ? '-90deg'
    : rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const dotScale = reduced
    ? 1
    : breathing.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] });

  const layer = { position: 'absolute', top: 0, left: 0, width: size, height: size } as const;

  return (
    <View
      testID={testID}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: size, height: size }}
    >
      <Svg style={layer} width={size} height={size} viewBox="0 0 48 48">
        <Circle
          cx={24}
          cy={24}
          r={ARC_RADIUS}
          stroke={stroke}
          strokeOpacity={0.18}
          strokeWidth={4}
          fill="none"
        />
      </Svg>
      <Animated.View style={[layer, { transform: [{ scale: dotScale }] }]}>
        <Svg width={size} height={size} viewBox="0 0 48 48">
          <Circle cx={24} cy={24} r={5} fill={stroke} />
        </Svg>
      </Animated.View>
      <Animated.View style={[layer, { transform: [{ rotate }] }]}>
        <Svg width={size} height={size} viewBox="0 0 48 48">
          <Circle
            cx={24}
            cy={24}
            r={ARC_RADIUS}
            stroke={stroke}
            strokeWidth={4}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${ARC_LENGTH} ${ARC_GAP}`}
          />
        </Svg>
      </Animated.View>
    </View>
  );
}

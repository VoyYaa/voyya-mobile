import React from 'react';
import { Animated, View } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { BRAND_COLORS } from '../../tokens';
import {
  BRAND_BALL_PATH,
  BRAND_FIGURE_BODY,
  BRAND_RING_RADIUS,
  type BrandFigure,
} from './brand-geometry';
import {
  TaxiDetailsShapes,
  TaxiRoofLightShapes,
  WheelDetailsShapes,
  WheelMarkShapes,
} from './figure-shapes';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedG = Animated.createAnimatedComponent(G);

export const MORPH_CIRCLE_PATH = BRAND_BALL_PATH;

export const MORPH_START_SCALE = 1;
export const MORPH_END_SCALE = 1;

export type BrandMorphTarget = BrandFigure;

export interface BrandMorphProps {
  target: BrandMorphTarget;
  progress: Animated.Value;
  size: number;
  ringOpacity?: Animated.Value | number;
  wheelsOpacity?: Animated.Value | number;
  bodyColor?: string;
  ringColor?: string;
  gapColor?: string;
  testID?: string;
}

export function BrandMorph({
  target,
  progress,
  size,
  ringOpacity = 1,
  wheelsOpacity = 1,
  bodyColor = BRAND_COLORS.amber,
  ringColor = BRAND_COLORS.amber,
  gapColor = BRAND_COLORS.espresso,
  testID,
}: BrandMorphProps): React.JSX.Element {
  const path = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [MORPH_CIRCLE_PATH, BRAND_FIGURE_BODY[target]],
  });
  const detailOpacity = progress.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [0, 0, 1],
    extrapolate: 'clamp',
  });
  const layer = { position: 'absolute', top: 0, left: 0, width: size, height: size } as const;

  return (
    <View
      testID={testID}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: size, height: size }}
    >
      <Animated.View style={[layer, { opacity: ringOpacity }]}>
        <Svg width={size} height={size} viewBox="0 0 200 200">
          <Circle
            cx={100}
            cy={100}
            r={BRAND_RING_RADIUS}
            fill="none"
            stroke={ringColor}
            strokeOpacity={0.65}
            strokeWidth={8}
          />
        </Svg>
      </Animated.View>
      <View style={layer}>
        <Svg width={size} height={size} viewBox="0 0 200 200">
          <AnimatedPath d={path} fill={bodyColor} />
          {target === 'taxi' && (
            <>
              <AnimatedG opacity={detailOpacity}>
                <TaxiDetailsShapes gapColor={gapColor} />
              </AnimatedG>
              <AnimatedG opacity={wheelsOpacity}>
                <TaxiRoofLightShapes bodyColor={bodyColor} gapColor={gapColor} />
              </AnimatedG>
            </>
          )}
          {target === 'wheel' && (
            <>
              <AnimatedG opacity={detailOpacity}>
                <WheelDetailsShapes bodyColor={bodyColor} gapColor={gapColor} />
              </AnimatedG>
              <AnimatedG opacity={wheelsOpacity}>
                <WheelMarkShapes />
              </AnimatedG>
            </>
          )}
        </Svg>
      </View>
    </View>
  );
}

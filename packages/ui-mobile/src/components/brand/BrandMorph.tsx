import React from 'react';
import { Animated, View } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { BRAND_COLORS } from '../../tokens';
import {
  BRAND_BALL_PATH,
  BRAND_CAR_BODY_PATH,
  BRAND_CAR_WINDOWS_PATH,
  BRAND_HEAD,
  BRAND_PERSON_BODY_PATH,
  BRAND_RING_RADIUS,
  BRAND_WHEELS,
  BRAND_WHEEL_GAP,
  BRAND_WHEEL_RADIUS,
} from './brand-geometry';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedG = Animated.createAnimatedComponent(G);

export const MORPH_CIRCLE_PATH = BRAND_BALL_PATH;
export const MORPH_PERSON_PATH = BRAND_PERSON_BODY_PATH;
export const MORPH_CAR_PATH = BRAND_CAR_BODY_PATH;

export const MORPH_START_SCALE = 1;
export const MORPH_END_SCALE = 1;

export type BrandMorphTarget = 'person' | 'car';

export interface BrandMorphProps {
  target: BrandMorphTarget;
  progress: Animated.Value;
  size: number;
  ringOpacity?: Animated.Value | number;
  wheelsOpacity?: Animated.Value | number;
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
  ringColor = BRAND_COLORS.amber,
  gapColor = BRAND_COLORS.espresso,
  testID,
}: BrandMorphProps): React.JSX.Element {
  const targetPath = target === 'car' ? MORPH_CAR_PATH : MORPH_PERSON_PATH;
  const path = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [MORPH_CIRCLE_PATH, targetPath],
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
          <AnimatedPath d={path} fill={BRAND_COLORS.amber} />
          {target === 'person' && (
            <AnimatedG opacity={detailOpacity}>
              <Circle
                cx={BRAND_HEAD.cx}
                cy={BRAND_HEAD.cy}
                r={BRAND_HEAD.r}
                fill={BRAND_COLORS.amber}
              />
            </AnimatedG>
          )}
          {target === 'car' && (
            <>
              <AnimatedG opacity={detailOpacity}>
                <Path d={BRAND_CAR_WINDOWS_PATH} fill={gapColor} />
              </AnimatedG>
              <AnimatedG opacity={wheelsOpacity}>
                {BRAND_WHEELS.map((wheel) => (
                  <Circle
                    key={wheel.cx}
                    cx={wheel.cx}
                    cy={wheel.cy}
                    r={BRAND_WHEEL_RADIUS}
                    fill={BRAND_COLORS.amber}
                    stroke={gapColor}
                    strokeWidth={BRAND_WHEEL_GAP}
                  />
                ))}
              </AnimatedG>
            </>
          )}
        </Svg>
      </View>
    </View>
  );
}

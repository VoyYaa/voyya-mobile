import React from 'react';
import { Animated, View } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { BRAND_COLORS } from '../../tokens';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedG = Animated.createAnimatedComponent(G);

export const MORPH_CIRCLE_PATH =
  'M170,100 L165,127 L150,150 L127,165 L100,170 L73,165 L50,150 L35,127 L30,100 L35,73 L50,50 L73,35 L100,30 L127,35 L150,50 L165,73 Z';
export const MORPH_PERSON_PATH =
  'M128,52 L134,66 L136,79 L170,94 L156,126 L139,156 L114,177 L86,177 L61,156 L44,126 L30,94 L64,79 L66,66 L73,52 L91,51 L109,51 Z';
export const MORPH_CAR_PATH =
  'M168,108 L178,122 L175,140 L160,155 L120,158 L80,158 L45,155 L28,142 L22,124 L30,105 L48,80 L72,68 L108,66 L135,80 L152,95 L162,100 Z';

export const MORPH_START_SCALE = 0.386;
export const MORPH_END_SCALE = 0.62;

export type BrandMorphTarget = 'person' | 'car';

export interface BrandMorphProps {
  target: BrandMorphTarget;
  progress: Animated.Value;
  size: number;
  ringOpacity?: Animated.Value | number;
  wheelsOpacity?: Animated.Value | number;
  ringColor?: string;
  testID?: string;
}

export function BrandMorph({
  target,
  progress,
  size,
  ringOpacity = 1,
  wheelsOpacity = 1,
  ringColor = BRAND_COLORS.amber,
  testID,
}: BrandMorphProps): React.JSX.Element {
  const targetPath = target === 'car' ? MORPH_CAR_PATH : MORPH_PERSON_PATH;
  const path = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [MORPH_CIRCLE_PATH, targetPath],
  });
  const scale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [MORPH_START_SCALE, MORPH_END_SCALE],
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
            r={47}
            fill="none"
            stroke={ringColor}
            strokeOpacity={0.65}
            strokeWidth={8}
          />
        </Svg>
      </Animated.View>
      <Animated.View style={[layer, { transform: [{ scale }] }]}>
        <Svg width={size} height={size} viewBox="0 0 200 200">
          <AnimatedPath
            d={path}
            fill={BRAND_COLORS.amber}
            stroke={BRAND_COLORS.amber}
            strokeWidth={6}
            strokeLinejoin="round"
          />
          {target === 'car' && (
            <AnimatedG opacity={wheelsOpacity}>
              <Circle cx={150} cy={158} r={22} fill={BRAND_COLORS.amber} />
              <Circle cx={58} cy={158} r={22} fill={BRAND_COLORS.amber} />
            </AnimatedG>
          )}
        </Svg>
      </Animated.View>
    </View>
  );
}

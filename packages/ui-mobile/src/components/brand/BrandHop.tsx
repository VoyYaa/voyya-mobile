import React, { useMemo } from 'react';
import { Animated, View, type ViewStyle } from 'react-native';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import { BRAND_COLORS } from '../../tokens';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { buildHopKeyframes, type Keyframes } from '../../motion/hop-timeline';
import { useHopCycle } from '../../motion/useHopCycle';
import {
  BRAND_BALL_PATH,
  BRAND_CAR_WINDOWS_PATH,
  BRAND_CENTER,
  BRAND_FIGURE_BODY,
  BRAND_FIGURE_SHADOW_SPREAD,
  BRAND_HEAD,
  BRAND_RING_RADIUS,
  BRAND_SHADOW_RX,
  BRAND_SHADOW_RY,
  BRAND_SHADOW_Y,
  BRAND_VIEWBOX,
  BRAND_WHEELS,
  BRAND_WHEEL_GAP,
  BRAND_WHEEL_RADIUS,
  type BrandFigure,
} from './brand-geometry';

const AnimatedPath = Animated.createAnimatedComponent(Path);

export interface BrandHopProps {
  size: number;
  target?: BrandFigure;
  loop?: boolean;
  active?: boolean;
  onSettled?: () => void;
  ringColor?: string;
  gapColor?: string;
  glowColor?: string;
  testID?: string;
}

const DEFAULT_GLOW = 'rgba(244, 162, 26, 0.55)';
const RIPPLE_FLATTEN = 0.28;
const WHEEL_BOX = (BRAND_WHEEL_RADIUS + BRAND_WHEEL_GAP) * 2 + 2;
const HEAD_BOX = BRAND_HEAD.r * 2 + 2;

function interpolateClock(
  clock: Animated.Value,
  frames: Keyframes,
): Animated.AnimatedInterpolation<number> {
  return clock.interpolate({
    inputRange: frames.inputRange,
    outputRange: frames.outputRange,
    extrapolate: 'clamp',
  });
}

export function BrandHop({
  size,
  target,
  loop = true,
  active = true,
  onSettled,
  ringColor = BRAND_COLORS.amber,
  gapColor = BRAND_COLORS.espresso,
  glowColor = DEFAULT_GLOW,
  testID,
}: BrandHopProps): React.JSX.Element {
  const reduced = useReducedMotion();
  const figure = target !== undefined;
  const unit = size / BRAND_VIEWBOX;
  const frames = useMemo(
    () =>
      buildHopKeyframes({
        size,
        figure,
        shadowSpread: target ? BRAND_FIGURE_SHADOW_SPREAD[target] : 1,
      }),
    [size, figure, target],
  );
  const { clock, morph } = useHopCycle({
    figure,
    loop,
    active,
    reduced,
    settledMs: frames.settledMs,
    onSettled,
  });

  const bodyPath = useMemo(
    () =>
      morph.interpolate({
        inputRange: [0, 1],
        outputRange: [BRAND_BALL_PATH, target ? BRAND_FIGURE_BODY[target] : BRAND_BALL_PATH],
      }),
    [morph, target],
  );

  const values = useMemo(() => {
    const at = (keyframes: Keyframes): Animated.AnimatedInterpolation<number> =>
      interpolateClock(clock, keyframes);
    return {
      translateY: at(frames.translateY),
      scaleX: at(frames.scaleX),
      scaleY: at(frames.scaleY),
      ringOpacity: at(frames.ringOpacity),
      ringScale: at(frames.ringScale),
      rippleOpacity: at(frames.rippleOpacity),
      rippleScale: at(frames.rippleScale),
      shadowOpacity: at(frames.shadowOpacity),
      shadowScaleX: at(frames.shadowScaleX),
      headScale: at(frames.headScale),
      headTranslateY: at(frames.headTranslateY),
      wheelScaleFront: at(frames.wheelScaleFront),
      wheelScaleRear: at(frames.wheelScaleRear),
      windowOpacity: at(frames.windowOpacity),
    };
  }, [clock, frames]);
  const {
    translateY,
    scaleX,
    scaleY,
    ringOpacity,
    ringScale,
    rippleOpacity,
    rippleScale,
    shadowOpacity,
    shadowScaleX,
    headScale,
    headTranslateY,
    wheelScaleFront,
    wheelScaleRear,
    windowOpacity,
  } = values;

  const fill = { position: 'absolute', top: 0, left: 0, width: size, height: size } as const;
  const groundLayer = {
    ...fill,
    top: (BRAND_SHADOW_Y - BRAND_CENTER) * unit,
  } as const;
  const pieceBox = (cx: number, cy: number, box: number): ViewStyle => ({
    position: 'absolute',
    left: (cx - box / 2) * unit,
    top: (cy - box / 2) * unit,
    width: box * unit,
    height: box * unit,
  });

  return (
    <View
      testID={testID}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: size, height: size }}
    >
      <Animated.View
        style={[groundLayer, { opacity: shadowOpacity, transform: [{ scaleX: shadowScaleX }] }]}
      >
        <Svg width={size} height={size} viewBox="0 0 200 200">
          <Ellipse
            cx={BRAND_CENTER}
            cy={BRAND_CENTER}
            rx={BRAND_SHADOW_RX}
            ry={BRAND_SHADOW_RY}
            fill={glowColor}
          />
        </Svg>
      </Animated.View>

      <Animated.View
        style={[
          groundLayer,
          { opacity: rippleOpacity, transform: [{ scaleY: RIPPLE_FLATTEN }, { scale: rippleScale }] },
        ]}
      >
        <Svg width={size} height={size} viewBox="0 0 200 200">
          <Circle
            cx={BRAND_CENTER}
            cy={BRAND_CENTER}
            r={BRAND_RING_RADIUS}
            fill="none"
            stroke={ringColor}
            strokeWidth={8}
          />
        </Svg>
      </Animated.View>

      <Animated.View style={[fill, { opacity: ringOpacity, transform: [{ scale: ringScale }] }]}>
        <Svg width={size} height={size} viewBox="0 0 200 200">
          <Circle
            cx={BRAND_CENTER}
            cy={BRAND_CENTER}
            r={BRAND_RING_RADIUS}
            fill="none"
            stroke={ringColor}
            strokeOpacity={0.65}
            strokeWidth={8}
          />
        </Svg>
      </Animated.View>

      <Animated.View style={[fill, { transform: [{ translateY }, { scaleX }, { scaleY }] }]}>
        <Svg width={size} height={size} viewBox="0 0 200 200">
          <AnimatedPath d={bodyPath} fill={BRAND_COLORS.amber} />
        </Svg>

        {target === 'person' && (
          <Animated.View
            style={[
              pieceBox(BRAND_HEAD.cx, BRAND_HEAD.cy, HEAD_BOX),
              { transform: [{ translateY: headTranslateY }, { scale: headScale }] },
            ]}
          >
            <Svg width="100%" height="100%" viewBox={`0 0 ${HEAD_BOX} ${HEAD_BOX}`}>
              <Circle
                cx={HEAD_BOX / 2}
                cy={HEAD_BOX / 2}
                r={BRAND_HEAD.r}
                fill={BRAND_COLORS.amber}
              />
            </Svg>
          </Animated.View>
        )}

        {target === 'car' && (
          <>
            <Animated.View style={[fill, { opacity: windowOpacity }]}>
              <Svg width={size} height={size} viewBox="0 0 200 200">
                <Path d={BRAND_CAR_WINDOWS_PATH} fill={gapColor} />
              </Svg>
            </Animated.View>
            {BRAND_WHEELS.map((wheel, index) => (
              <Animated.View
                key={wheel.cx}
                style={[
                  pieceBox(wheel.cx, wheel.cy, WHEEL_BOX),
                  { transform: [{ scale: index === 0 ? wheelScaleRear : wheelScaleFront }] },
                ]}
              >
                <Svg width="100%" height="100%" viewBox={`0 0 ${WHEEL_BOX} ${WHEEL_BOX}`}>
                  <Circle
                    cx={WHEEL_BOX / 2}
                    cy={WHEEL_BOX / 2}
                    r={BRAND_WHEEL_RADIUS}
                    fill={BRAND_COLORS.amber}
                    stroke={gapColor}
                    strokeWidth={BRAND_WHEEL_GAP}
                  />
                </Svg>
              </Animated.View>
            ))}
          </>
        )}
      </Animated.View>
    </View>
  );
}

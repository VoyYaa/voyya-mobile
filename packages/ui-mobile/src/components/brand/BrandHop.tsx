import React, { useMemo } from 'react';
import { Animated, View, type ViewStyle } from 'react-native';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import { BRAND_COLORS } from '../../tokens';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { buildHopKeyframes, type Keyframes } from '../../motion/hop-timeline';
import { useHopCycle } from '../../motion/useHopCycle';
import {
  BRAND_BALL_PATH,
  BRAND_CENTER,
  BRAND_FIGURE_BODY,
  BRAND_FIGURE_SHADOW_SPREAD,
  BRAND_RING_RADIUS,
  BRAND_SHADOW_RX,
  BRAND_SHADOW_RY,
  BRAND_SHADOW_Y,
  BRAND_TAXI_ROOF_PIVOT,
  BRAND_VIEWBOX,
  BRAND_WHEEL_CENTER,
  BRAND_WHEEL_MARK,
  type BrandFigure,
} from './brand-geometry';
import {
  BrandFigureIcon,
  TaxiDetailsShapes,
  TaxiRoofLightShapes,
  WheelDetailsShapes,
  WheelMarkShapes,
} from './figure-shapes';

const AnimatedPath = Animated.createAnimatedComponent(Path);

export interface BrandHopProps {
  size: number;
  target?: BrandFigure;
  loop?: boolean;
  active?: boolean;
  onSettled?: () => void;
  bodyColor?: string;
  ringColor?: string;
  gapColor?: string;
  glowColor?: string;
  testID?: string;
}

const DEFAULT_GLOW = 'rgba(244, 162, 26, 0.55)';
const RIPPLE_FLATTEN = 0.28;
const ROOF_LIGHT_BOX = 40;
const WHEEL_DETAILS_BOX = 124;
const WHEEL_MARK_BOX = 30;
const WHEEL_MARK_CENTER_Y = BRAND_WHEEL_MARK.y + BRAND_WHEEL_MARK.height / 2;
const FIGURE_HOLD_UNTIL_ICON = 0.5;

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
  bodyColor = BRAND_COLORS.amber,
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
  const { clock, morph, icon } = useHopCycle({
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
      roofLightScale: at(frames.roofLightScale),
      windowOpacity: at(frames.windowOpacity),
      detailsScale: at(frames.detailsScale),
      markScale: at(frames.markScale),
    };
  }, [clock, frames]);
  const figureOpacity = useMemo(
    () =>
      icon.interpolate({
        inputRange: [0, FIGURE_HOLD_UNTIL_ICON, 1],
        outputRange: [1, 1, 0],
      }),
    [icon],
  );
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
    roofLightScale,
    windowOpacity,
    detailsScale,
    markScale,
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
  const piece = (
    cx: number,
    cy: number,
    box: number,
    scale: Animated.AnimatedInterpolation<number>,
    children: React.ReactNode,
  ): React.JSX.Element => (
    <Animated.View style={[pieceBox(cx, cy, box), { transform: [{ scale }] }]}>
      <Svg width="100%" height="100%" viewBox={`${cx - box / 2} ${cy - box / 2} ${box} ${box}`}>
        {children}
      </Svg>
    </Animated.View>
  );

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
          {
            opacity: rippleOpacity,
            transform: [{ scaleY: RIPPLE_FLATTEN }, { scale: rippleScale }],
          },
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
        <Animated.View style={[fill, { opacity: figureOpacity }]}>
          <Svg width={size} height={size} viewBox="0 0 200 200">
            <AnimatedPath d={bodyPath} fill={bodyColor} />
          </Svg>

          {target === 'taxi' && (
            <>
              <Animated.View style={[fill, { opacity: windowOpacity }]}>
                <Svg width={size} height={size} viewBox="0 0 200 200">
                  <TaxiDetailsShapes gapColor={gapColor} />
                </Svg>
              </Animated.View>
              {piece(
                BRAND_TAXI_ROOF_PIVOT.cx,
                BRAND_TAXI_ROOF_PIVOT.cy,
                ROOF_LIGHT_BOX,
                roofLightScale,
                <TaxiRoofLightShapes bodyColor={bodyColor} gapColor={gapColor} />,
              )}
            </>
          )}

          {target === 'wheel' && (
            <>
              {piece(
                BRAND_WHEEL_CENTER.cx,
                BRAND_WHEEL_CENTER.cy,
                WHEEL_DETAILS_BOX,
                detailsScale,
                <WheelDetailsShapes bodyColor={bodyColor} gapColor={gapColor} />,
              )}
              {piece(
                BRAND_WHEEL_CENTER.cx,
                WHEEL_MARK_CENTER_Y,
                WHEEL_MARK_BOX,
                markScale,
                <WheelMarkShapes />,
              )}
            </>
          )}
        </Animated.View>

        {target !== undefined && (
          <Animated.View style={[fill, { opacity: icon }]}>
            <BrandFigureIcon
              figure={target}
              size={size}
              bodyColor={bodyColor}
              gapColor={gapColor}
            />
          </Animated.View>
        )}
      </Animated.View>
    </View>
  );
}

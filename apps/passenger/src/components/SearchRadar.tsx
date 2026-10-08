import React, { useEffect, useRef } from 'react';
import { Animated, Vibration, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import {
  BRAND_COLORS,
  BrandMorph,
  RadarPulse,
  USE_NATIVE_DRIVER,
  motion,
  useLoopValue,
  useReducedMotion,
  useTheme,
  withAlpha,
} from '@voyyaa/ui-mobile';
import { MATCH_TIMING } from '../constants/search-timing';

export interface SearchRadarProps {
  size: number;
  matched: boolean;
  prolonged: boolean;
  degraded: boolean;
  onMatchedDone: () => void;
  testID?: string;
}

const VIEWBOX = 320;
const GUIDE_RADII = [52, 92, 132] as const;
const SWEEP_PATH = 'M160 160 L160 28 A132 132 0 0 1 274.3 94 Z';
const SWEEP_EDGE_PATH = 'M160 160 L274.3 94';
const SATELLITE_PERIOD_MS = 4200;
const BREATH_PERIOD_MS = 1200;
const MARK_RATIO = 0.37;
const MATCH_SCALE_PEAK = 1.15;
const MATCH_SCALE_FINAL = 2.3;
const DEGRADED_OPACITY = 0.3;

export function SearchRadar({
  size,
  matched,
  prolonged,
  degraded,
  onMatchedDone,
  testID = 'search-radar',
}: SearchRadarProps): React.JSX.Element {
  const theme = useTheme();
  const reduced = useReducedMotion();

  const layersOpacity = useRef(new Animated.Value(1)).current;
  const morphProgress = useRef(new Animated.Value(0)).current;
  const ringOpacity = useRef(new Animated.Value(1)).current;
  const wheelsOpacity = useRef(new Animated.Value(0)).current;
  const matchScale = useRef(new Animated.Value(1)).current;
  const doneRingScale = useRef(new Animated.Value(0.3)).current;
  const doneRingOpacity = useRef(new Animated.Value(0)).current;
  const dimmed = useRef(new Animated.Value(1)).current;

  const onDoneRef = useRef(onMatchedDone);
  onDoneRef.current = onMatchedDone;

  const moving = !reduced && !matched;
  const sweep = useLoopValue(moving, { durationMs: motion.dur.sweep });
  const satellite = useLoopValue(moving, { durationMs: SATELLITE_PERIOD_MS });
  const breath = useLoopValue(moving, {
    durationMs: BREATH_PERIOD_MS,
    easing: motion.ease.inOut,
    reverse: true,
  });

  useEffect(() => {
    Animated.timing(dimmed, {
      toValue: degraded ? DEGRADED_OPACITY : 1,
      duration: motion.dur.base,
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();
  }, [degraded, dimmed]);

  useEffect(() => {
    if (!matched) return;
    Vibration.vibrate(MATCH_TIMING.vibrateMs);

    if (reduced) {
      layersOpacity.setValue(0);
      morphProgress.setValue(1);
      ringOpacity.setValue(0);
      wheelsOpacity.setValue(1);
      matchScale.setValue(MATCH_SCALE_FINAL);
      const hold = setTimeout(() => onDoneRef.current(), MATCH_TIMING.reducedHoldMs);
      return () => clearTimeout(hold);
    }

    const sequence = Animated.parallel([
      Animated.timing(layersOpacity, {
        toValue: 0,
        duration: MATCH_TIMING.layersFadeMs,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.sequence([
        Animated.timing(matchScale, {
          toValue: MATCH_SCALE_PEAK,
          duration: MATCH_TIMING.anticipationMs,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.parallel([
          Animated.timing(matchScale, {
            toValue: MATCH_SCALE_FINAL,
            duration: MATCH_TIMING.morphMs,
            easing: motion.ease.inOut,
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
          Animated.timing(morphProgress, {
            toValue: 1,
            duration: MATCH_TIMING.morphMs,
            easing: motion.ease.inOut,
            useNativeDriver: false,
          }),
          Animated.timing(ringOpacity, {
            toValue: 0,
            duration: MATCH_TIMING.morphMs,
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
        ]),
        Animated.timing(wheelsOpacity, {
          toValue: 1,
          duration: MATCH_TIMING.wheelsMs,
          easing: motion.ease.out,
          useNativeDriver: false,
        }),
      ]),
      Animated.sequence([
        Animated.delay(MATCH_TIMING.doneRingDelayMs),
        Animated.parallel([
          Animated.timing(doneRingScale, {
            toValue: 1.1,
            duration: MATCH_TIMING.doneRingMs,
            easing: motion.ease.out,
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
          Animated.sequence([
            Animated.timing(doneRingOpacity, {
              toValue: 1,
              duration: 1,
              useNativeDriver: USE_NATIVE_DRIVER,
            }),
            Animated.timing(doneRingOpacity, {
              toValue: 0,
              duration: MATCH_TIMING.doneRingMs,
              easing: motion.ease.out,
              useNativeDriver: USE_NATIVE_DRIVER,
            }),
          ]),
        ]),
      ]),
    ]);
    sequence.start();
    const done = setTimeout(() => onDoneRef.current(), MATCH_TIMING.navigateMs);
    return () => {
      sequence.stop();
      clearTimeout(done);
    };
  }, [
    matched,
    reduced,
    layersOpacity,
    morphProgress,
    ringOpacity,
    wheelsOpacity,
    matchScale,
    doneRingScale,
    doneRingOpacity,
  ]);

  const layer = { position: 'absolute', top: 0, left: 0, width: size, height: size } as const;
  const markSize = Math.round(size * MARK_RATIO);
  const outerGuideColor = prolonged ? withAlpha(BRAND_COLORS.amber, 0.35) : theme.colors.stageLine;
  const breathScale = breath.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] });
  const sweepRotation = sweep.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const satelliteRotation = satellite.interpolate({
    inputRange: [0, 1],
    outputRange: ['360deg', '0deg'],
  });

  return (
    <Animated.View
      testID={testID}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: size, height: size, opacity: dimmed }}
    >
      <View style={layer}>
        <Svg width={size} height={size} viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}>
          {GUIDE_RADII.map((radius, index) => (
            <Circle
              key={radius}
              cx={VIEWBOX / 2}
              cy={VIEWBOX / 2}
              r={radius}
              fill="none"
              stroke={index === GUIDE_RADII.length - 1 ? outerGuideColor : theme.colors.stageLine}
              strokeWidth={1}
            />
          ))}
        </Svg>
      </View>

      <Animated.View style={[layer, { opacity: layersOpacity }]}>
        <View style={[layer, { alignItems: 'center', justifyContent: 'center' }]}>
          <RadarPulse
            size={Math.round((size * 256) / VIEWBOX)}
            rings={3}
            periodMs={motion.dur.pulse}
            color={BRAND_COLORS.amber}
            fillOpacity={0.12}
            strokeOpacity={0.45}
          />
        </View>
        {!reduced && (
          <Animated.View style={[layer, { transform: [{ rotate: sweepRotation }] }]}>
            <Svg width={size} height={size} viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}>
              <Defs>
                <LinearGradient id="vy-sweep" x1="0.1" y1="0" x2="0.9" y2="0.5">
                  <Stop offset="0" stopColor={BRAND_COLORS.amber} stopOpacity={0} />
                  <Stop offset="1" stopColor={BRAND_COLORS.amber} stopOpacity={0.38} />
                </LinearGradient>
              </Defs>
              <Path d={SWEEP_PATH} fill="url(#vy-sweep)" />
              <Path
                d={SWEEP_EDGE_PATH}
                stroke={BRAND_COLORS.amber}
                strokeOpacity={0.7}
                strokeWidth={2}
              />
            </Svg>
          </Animated.View>
        )}
        {!reduced && (
          <Animated.View style={[layer, { transform: [{ rotate: satelliteRotation }] }]}>
            <Svg width={size} height={size} viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}>
              <Circle cx={VIEWBOX / 2} cy={28} r={5} fill={BRAND_COLORS.crema} />
            </Svg>
          </Animated.View>
        )}
      </Animated.View>

      <View style={[layer, { alignItems: 'center', justifyContent: 'center' }]}>
        <Animated.View
          style={{
            position: 'absolute',
            width: markSize,
            height: markSize,
            borderRadius: markSize / 2,
            borderWidth: 3,
            borderColor: BRAND_COLORS.go,
            opacity: doneRingOpacity,
            transform: [{ scale: doneRingScale }],
          }}
        />
        <Animated.View style={{ transform: [{ scale: reduced || matched ? 1 : breathScale }] }}>
          <Animated.View style={{ transform: [{ scale: matchScale }] }}>
            <BrandMorph
              target="car"
              size={markSize}
              progress={morphProgress}
              ringOpacity={ringOpacity}
              wheelsOpacity={wheelsOpacity}
            />
          </Animated.View>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

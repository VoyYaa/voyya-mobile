import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import {
  BRAND_COLORS,
  RadarPulse,
  motion,
  useReducedMotion,
  useTheme,
  withAlpha,
} from '@voyyaa/ui-mobile';
import { passengerCopy } from '../copy/passenger-copy';

export type TripStep = 0 | 1 | 2 | 3;

export interface TripStepRailProps {
  current: TripStep;
  testID?: string;
}

const STEP_LABELS = [
  passengerCopy.trip.stepAssigned,
  passengerCopy.trip.stepEnRoute,
  passengerCopy.trip.stepArrived,
  passengerCopy.trip.stepInTrip,
] as const;

const NODE_SIZE = 28;
const TRACK_HEIGHT = 3;
const PULSE_SIZE = 48;
const LAST_STEP = STEP_LABELS.length - 1;

function StepNode({ state }: { state: 'done' | 'current' | 'future' }): React.JSX.Element {
  const theme = useTheme();

  if (state === 'done') {
    return (
      <View
        style={{
          width: NODE_SIZE,
          height: NODE_SIZE,
          borderRadius: NODE_SIZE / 2,
          backgroundColor: BRAND_COLORS.amber,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Svg width={16} height={16} viewBox="0 0 16 16">
          <Path
            d="M3 8.5 L6.5 12 L13 4.5"
            stroke={BRAND_COLORS.espresso}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </Svg>
      </View>
    );
  }

  return (
    <View
      style={{
        width: NODE_SIZE,
        height: NODE_SIZE,
        borderRadius: NODE_SIZE / 2,
        borderWidth: 3,
        borderColor:
          state === 'current' ? BRAND_COLORS.amber : withAlpha(theme.colors.onStage, 0.35),
        backgroundColor: theme.colors.stage,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {state === 'current' && (
        <View
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: BRAND_COLORS.amber,
          }}
        />
      )}
    </View>
  );
}

export function TripStepRail({
  current,
  testID = 'trip-step-rail',
}: TripStepRailProps): React.JSX.Element {
  const theme = useTheme();
  const reduced = useReducedMotion();
  const [trackWidth, setTrackWidth] = useState(0);
  const fill = useRef(new Animated.Value(current / LAST_STEP)).current;

  useEffect(() => {
    const animation = Animated.timing(fill, {
      toValue: current / LAST_STEP,
      duration: reduced ? motion.reducedFadeMs : motion.dur.draw,
      easing: motion.ease.out,
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [current, fill, reduced]);

  const handleLayout = (event: LayoutChangeEvent): void =>
    setTrackWidth(event.nativeEvent.layout.width);

  const fillWidth = fill.interpolate({ inputRange: [0, 1], outputRange: [0, trackWidth] });

  return (
    <View
      testID={testID}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={passengerCopy.trip.stepsLabel(STEP_LABELS[current])}
      accessibilityValue={{ min: 0, max: LAST_STEP, now: current }}
    >
      <View style={{ height: PULSE_SIZE, justifyContent: 'center' }}>
        <View
          onLayout={handleLayout}
          style={{
            position: 'absolute',
            left: '12.5%',
            right: '12.5%',
            height: TRACK_HEIGHT,
            borderRadius: TRACK_HEIGHT / 2,
            backgroundColor: withAlpha(theme.colors.onStage, 0.2),
            overflow: 'hidden',
          }}
        >
          <Animated.View
            style={{
              width: fillWidth,
              height: TRACK_HEIGHT,
              backgroundColor: BRAND_COLORS.amber,
            }}
          />
        </View>
        <View style={{ flexDirection: 'row' }}>
          {STEP_LABELS.map((label, index) => (
            <View key={label} style={{ flex: 1, alignItems: 'center' }}>
              {index === current && (
                <View style={{ position: 'absolute' }}>
                  <RadarPulse size={PULSE_SIZE} rings={1} periodMs={motion.dur.pulse} />
                </View>
              )}
              <StepNode
                state={index < current ? 'done' : index === current ? 'current' : 'future'}
              />
            </View>
          ))}
        </View>
      </View>
      <View style={{ flexDirection: 'row' }}>
        {STEP_LABELS.map((label, index) => (
          <Text
            key={label}
            numberOfLines={1}
            accessibilityElementsHidden
            style={{
              flex: 1,
              textAlign: 'center',
              ...(index <= current ? theme.typography.smallStrong : theme.typography.small),
              color: index <= current ? theme.colors.onStage : theme.colors.onStageMuted,
            }}
          >
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
}

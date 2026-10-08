import React from 'react';
import { Animated, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { motion, useLoopValue, useReducedMotion, useTheme } from '@voyyaa/ui-mobile';

export interface DriverStepRailProps {
  steps: readonly string[];
  activeIndex: number;
}

const NODE_SIZE = 28;
const DOT_SIZE = 12;
const LINE_HEIGHT = 2;
const PULSE_MS = 1200;

interface StepNodeProps {
  state: 'done' | 'current' | 'todo';
}

function StepNode({ state }: StepNodeProps): React.JSX.Element {
  const theme = useTheme();
  const { colors } = theme;
  const reduced = useReducedMotion();
  const beat = useLoopValue(state === 'current' && !reduced, {
    durationMs: PULSE_MS,
    easing: motion.ease.inOut,
    reverse: true,
  });
  const dotScale = reduced ? 1 : beat.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.1] });

  const base = {
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };

  if (state === 'done') {
    return (
      <View style={{ ...base, backgroundColor: colors.success }}>
        <Svg width={16} height={16} viewBox="0 0 24 24">
          <Path
            d="M5 12.5 L10 17.5 L19 7"
            stroke={colors.onSuccess}
            strokeWidth={3.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </Svg>
      </View>
    );
  }

  if (state === 'current') {
    return (
      <View style={{ ...base, borderWidth: 2, borderColor: colors.brand }}>
        <Animated.View
          style={{
            width: DOT_SIZE,
            height: DOT_SIZE,
            borderRadius: DOT_SIZE / 2,
            backgroundColor: colors.brand,
            transform: [{ scale: dotScale }],
          }}
        />
      </View>
    );
  }

  return <View style={{ ...base, borderWidth: 2, borderColor: colors.stageLine }} />;
}

export function DriverStepRail({ steps, activeIndex }: DriverStepRailProps): React.JSX.Element {
  const theme = useTheme();
  const { colors } = theme;

  return (
    <View
      testID="driver-step-rail"
      accessible
      accessibilityLabel={`Paso ${activeIndex + 1} de ${steps.length}: ${steps[activeIndex] ?? ''}`}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {steps.map((label, index) => (
          <React.Fragment key={label}>
            {index > 0 && (
              <View
                style={{
                  flex: 1,
                  height: LINE_HEIGHT,
                  backgroundColor: index <= activeIndex ? colors.success : colors.stageLine,
                }}
              />
            )}
            <StepNode
              state={index < activeIndex ? 'done' : index === activeIndex ? 'current' : 'todo'}
            />
          </React.Fragment>
        ))}
      </View>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: theme.spacing.xs,
        }}
      >
        {steps.map((label, index) => (
          <Text
            key={label}
            style={{
              ...(index === activeIndex ? theme.typography.smallStrong : theme.typography.small),
              color: index === activeIndex ? colors.onStage : colors.onStageMuted,
            }}
          >
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
}

import React, { useState } from 'react';
import {
  Animated,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../theme';
import { BRAND_COLORS, motion } from '../tokens';
import { uiCopy } from '../copy';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useLoopValue } from '../motion/useLoopValue';
import { withAlpha } from '../utils/color';

export interface ProgressRailProps {
  value?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const RAIL_HEIGHT = 3;
const SEGMENT_RATIO = 0.3;
const INDETERMINATE_PERIOD_MS = 1100;

export function ProgressRail({
  value,
  style,
  testID = 'progress-rail',
}: ProgressRailProps): React.JSX.Element {
  const theme = useTheme();
  const reduced = useReducedMotion();
  const [width, setWidth] = useState(0);
  const indeterminate = value === undefined;
  const travel = useLoopValue(indeterminate && !reduced, {
    durationMs: INDETERMINATE_PERIOD_MS,
    easing: motion.ease.inOut,
  });

  const handleLayout = (event: LayoutChangeEvent): void => setWidth(event.nativeEvent.layout.width);

  const segmentWidth = width * SEGMENT_RATIO;
  const clamped = value === undefined ? 0 : Math.min(1, Math.max(0, value));

  let bar: React.JSX.Element | null = null;
  if (width > 0) {
    if (!indeterminate) {
      bar = (
        <View
          style={{
            width: width * clamped,
            height: RAIL_HEIGHT,
            backgroundColor: BRAND_COLORS.amber,
          }}
        />
      );
    } else if (reduced) {
      bar = (
        <View
          style={{
            width: width * 0.4,
            height: RAIL_HEIGHT,
            backgroundColor: BRAND_COLORS.amber,
            opacity: 0.6,
          }}
        />
      );
    } else {
      const translateX = travel.interpolate({
        inputRange: [0, 1],
        outputRange: [-segmentWidth, width],
      });
      bar = (
        <Animated.View
          style={{
            width: segmentWidth,
            height: RAIL_HEIGHT,
            backgroundColor: BRAND_COLORS.amber,
            transform: [{ translateX }],
          }}
        />
      );
    }
  }

  return (
    <View
      testID={testID}
      onLayout={handleLayout}
      accessibilityRole="progressbar"
      accessibilityLabel={uiCopy.loading}
      accessibilityValue={
        indeterminate
          ? { text: uiCopy.updating }
          : { min: 0, max: 100, now: Math.round(clamped * 100) }
      }
      style={[
        {
          height: RAIL_HEIGHT,
          overflow: 'hidden',
          backgroundColor: withAlpha(BRAND_COLORS.amber, theme.mode === 'dark' ? 0.18 : 0.22),
        },
        style,
      ]}
    >
      {bar}
    </View>
  );
}

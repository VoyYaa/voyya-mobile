import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Text,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type TextStyle,
} from 'react-native';
import { useTheme } from '../theme';
import { USE_NATIVE_DRIVER, motion } from '../tokens';
import { useReducedMotion } from '../hooks/useReducedMotion';

export type AccentTextVariant = 'display' | 'headline';

export interface AccentTextProps {
  children: string;
  accent: string;
  variant?: AccentTextVariant;
  color?: string;
  style?: StyleProp<TextStyle>;
  testID?: string;
}

const BAR_HEIGHT = 4;
const BAR_DELAY_MS = 350;

export function AccentText({
  children,
  accent,
  variant = 'display',
  color,
  style,
  testID,
}: AccentTextProps): React.JSX.Element {
  const theme = useTheme();
  const reduced = useReducedMotion();
  const [accentWidth, setAccentWidth] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (accentWidth === 0) return;
    if (reduced) {
      progress.setValue(1);
      return;
    }
    const animation = Animated.sequence([
      Animated.delay(BAR_DELAY_MS),
      Animated.timing(progress, {
        toValue: 1,
        duration: motion.dur.draw,
        easing: motion.ease.out,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [accentWidth, reduced, progress]);

  const textStyle: TextStyle = {
    ...theme.typography[variant],
    color: color ?? theme.colors.text,
  };
  const start = accent.length > 0 ? children.indexOf(accent) : -1;
  const handleAccentLayout = (event: LayoutChangeEvent): void =>
    setAccentWidth(event.nativeEvent.layout.width);

  if (start < 0) {
    return (
      <Text testID={testID} accessibilityRole="header" style={[textStyle, style]}>
        {children}
      </Text>
    );
  }

  const before = children.slice(0, start);
  const after = children.slice(start + accent.length);
  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-accentWidth / 2, 0],
  });

  return (
    <View
      testID={testID}
      accessible
      accessibilityRole="header"
      accessibilityLabel={children}
      style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end' }}
    >
      {before.length > 0 && (
        <Text accessibilityElementsHidden style={[textStyle, style]}>
          {before}
        </Text>
      )}
      <View accessibilityElementsHidden onLayout={handleAccentLayout}>
        <Text style={[textStyle, style]}>{accent}</Text>
        <Animated.View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 2,
            height: BAR_HEIGHT,
            borderRadius: BAR_HEIGHT / 2,
            backgroundColor: theme.colors.brand,
            transform: [{ translateX }, { scaleX: progress }],
          }}
        />
      </View>
      {after.length > 0 && (
        <Text accessibilityElementsHidden style={[textStyle, style]}>
          {after}
        </Text>
      )}
    </View>
  );
}

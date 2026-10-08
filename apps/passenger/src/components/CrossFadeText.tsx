import React, { useEffect, useRef } from 'react';
import { Animated, View, type TextStyle } from 'react-native';
import { USE_NATIVE_DRIVER, motion } from '@voyyaa/ui-mobile';

export interface CrossFadeTextProps {
  lines: readonly string[];
  activeIndex: number;
  style: TextStyle;
  reservedLines?: number;
  announceFromIndex?: number;
  accessibilityRole?: 'header';
  testID?: string;
}

const FADE_MS = motion.dur.base;

export function CrossFadeText({
  lines,
  activeIndex,
  style,
  reservedLines = 1,
  announceFromIndex,
  accessibilityRole,
  testID,
}: CrossFadeTextProps): React.JSX.Element {
  const opacities = useRef(
    lines.map((_, index) => new Animated.Value(index === activeIndex ? 1 : 0)),
  ).current;

  useEffect(() => {
    const animation = Animated.parallel(
      opacities.map((opacity, index) =>
        Animated.timing(opacity, {
          toValue: index === activeIndex ? 1 : 0,
          duration: FADE_MS,
          easing: motion.ease.out,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ),
    );
    animation.start();
    return () => animation.stop();
  }, [activeIndex, opacities]);

  const lineHeight = style.lineHeight ?? 24;

  return (
    <View testID={testID} style={{ height: lineHeight * reservedLines, alignSelf: 'stretch' }}>
      {lines.map((line, index) => {
        const active = index === activeIndex;
        const announce = announceFromIndex !== undefined && index >= announceFromIndex && active;
        return (
          <Animated.Text
            key={line}
            accessibilityRole={active ? accessibilityRole : undefined}
            accessibilityElementsHidden={!active}
            importantForAccessibility={active ? 'auto' : 'no-hide-descendants'}
            accessibilityLiveRegion={announce ? 'polite' : 'none'}
            style={[
              style,
              { position: 'absolute', top: 0, left: 0, right: 0, opacity: opacities[index] },
            ]}
          >
            {line}
          </Animated.Text>
        );
      })}
    </View>
  );
}

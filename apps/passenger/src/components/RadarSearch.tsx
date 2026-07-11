import React, { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';
import { useReducedMotion, useTheme } from '@voyyaa/ui-mobile';

const SIZE = 140;

export function RadarSearch(): React.JSX.Element {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reducedMotion) return;
    const loop = Animated.loop(Animated.timing(progress, { toValue: 1, duration: 1800, useNativeDriver: true }));
    loop.start();
    return () => {
      loop.stop();
      progress.setValue(0);
    };
  }, [reducedMotion, progress]);

  const ringStyle = reducedMotion
    ? { opacity: 0.5 }
    : {
        opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] }),
        transform: [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1.4] }) }],
      };

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}
    >
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: SIZE,
            height: SIZE,
            borderRadius: SIZE / 2,
            borderWidth: 3,
            borderColor: theme.colors.brand,
          },
          ringStyle,
        ]}
      />
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: theme.colors.brand,
          alignItems: 'center',
          justifyContent: 'center',
          ...theme.shadow.md,
        }}
      >
        <Text style={{ ...theme.typography.title, color: theme.colors.onBrand }}>V</Text>
      </View>
    </View>
  );
}

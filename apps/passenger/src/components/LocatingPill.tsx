import React, { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';
import { useReducedMotion, useTheme } from '@voyyaa/ui-mobile';

export function LocatingPill(): React.JSX.Element {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reducedMotion) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => {
      loop.stop();
      pulse.setValue(0);
    };
  }, [reducedMotion, pulse]);

  const dotStyle = reducedMotion
    ? { opacity: 1 }
    : { opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) };

  return (
    <View
      accessibilityLabel="Buscando tu ubicación"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: theme.spacing.xs,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.pill,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 6,
        ...theme.shadow.sm,
      }}
    >
      <Animated.View
        style={[
          { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.brand },
          dotStyle,
        ]}
      />
      <Text style={{ ...theme.typography.small, color: theme.colors.textMuted }}>
        Buscando tu ubicación…
      </Text>
    </View>
  );
}

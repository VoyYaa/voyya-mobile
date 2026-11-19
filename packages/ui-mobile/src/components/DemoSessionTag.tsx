import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../theme';
import { useFocusState } from '../hooks/useFocusState';
import { useReducedMotion } from '../hooks/useReducedMotion';
import {
  DEMO_TAG_DOT_SIZE,
  DEMO_TAG_MAX_FONT_MULTIPLIER,
  DEMO_TAG_PRESSED_OPACITY,
  demoTagA11y,
  demoTagContainerMinHeight,
} from '../utils/demo-tag';

export interface DemoSessionTagProps {
  label: string;
  accessibilityLabel: string;
  accessibilityHint?: string;
  onPress: () => void;
  testID?: string;
}

export function DemoSessionTag({
  label,
  accessibilityLabel,
  accessibilityHint,
  onPress,
  testID,
}: DemoSessionTagProps): React.JSX.Element {
  const theme = useTheme();
  const reduced = useReducedMotion();
  const { focused, onFocus, onBlur } = useFocusState();

  return (
    <Pressable
      {...demoTagA11y(accessibilityLabel, accessibilityHint)}
      onPress={onPress}
      onFocus={onFocus}
      onBlur={onBlur}
      testID={testID}
      style={({ pressed }) => ({
        alignSelf: 'flex-start',
        minHeight: demoTagContainerMinHeight(theme.touch.min),
        justifyContent: 'center',
        opacity: pressed && !reduced ? DEMO_TAG_PRESSED_OPACITY : 1,
      })}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing.sm,
          backgroundColor: theme.colors.infoTint,
          borderRadius: theme.radius.pill,
          paddingVertical: theme.spacing.xs,
          paddingHorizontal: theme.spacing.md,
          borderWidth: 2,
          borderColor: focused ? theme.colors.focusRing : 'transparent',
        }}
      >
        <View
          style={{
            width: DEMO_TAG_DOT_SIZE,
            height: DEMO_TAG_DOT_SIZE,
            borderRadius: DEMO_TAG_DOT_SIZE / 2,
            backgroundColor: theme.colors.info,
          }}
        />
        <Text
          maxFontSizeMultiplier={DEMO_TAG_MAX_FONT_MULTIPLIER}
          style={{ ...theme.typography.smallStrong, color: theme.colors.infoInk, flexShrink: 1 }}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

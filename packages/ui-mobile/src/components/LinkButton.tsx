import React from 'react';
import {
  Pressable,
  Text,
  View,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../theme';
import { useFocusState } from '../hooks/useFocusState';

export type LinkButtonTone = 'default' | 'danger' | 'muted';

export interface LinkButtonProps {
  label: string;
  onPress: (event: GestureResponderEvent) => void;
  tone?: LinkButtonTone;
  trailing?: React.ReactNode;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

export function LinkButton({
  label,
  onPress,
  tone = 'default',
  trailing,
  disabled = false,
  style,
  accessibilityLabel,
  accessibilityHint,
  testID,
}: LinkButtonProps): React.JSX.Element {
  const theme = useTheme();
  const { focused, onFocus, onBlur } = useFocusState();

  const palette: Record<LinkButtonTone, { text: string; line: string }> = {
    default: { text: theme.colors.text, line: theme.colors.brand },
    danger: { text: theme.colors.dangerInk, line: theme.colors.danger },
    muted: { text: theme.colors.textMuted, line: theme.colors.borderStrong },
  };
  const colors = palette[tone];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      onFocus={onFocus}
      onBlur={onBlur}
      testID={testID}
      style={({ pressed }) => [
        {
          minHeight: theme.touch.min,
          minWidth: theme.touch.min,
          alignSelf: 'flex-start',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          paddingHorizontal: theme.spacing.xs,
          borderRadius: theme.radius.chip,
          borderWidth: 2,
          borderColor: focused ? theme.colors.focusRing : 'transparent',
          opacity: disabled ? 0.5 : pressed ? 0.7 : 1,
        },
        style,
      ]}
    >
      <View
        style={{
          borderBottomWidth: 3,
          borderBottomColor: colors.line,
          paddingBottom: 1,
        }}
      >
        <Text
          maxFontSizeMultiplier={1.3}
          style={{ ...theme.typography.button, fontSize: 16, color: colors.text }}
        >
          {label}
        </Text>
      </View>
      {trailing && <View style={{ marginLeft: theme.spacing.sm }}>{trailing}</View>}
    </Pressable>
  );
}

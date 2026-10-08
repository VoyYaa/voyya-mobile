import React from 'react';
import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../theme';
import { useFocusState } from '../hooks/useFocusState';

export type ChipTone = 'neutral' | 'brand' | 'brandTint' | 'success' | 'danger';

export interface ChipProps {
  label: string;
  tone?: ChipTone;
  selected?: boolean;
  onPress?: () => void;
  leading?: string;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  testID?: string;
}

const VISUAL_MIN_HEIGHT = 32;

export function Chip({
  label,
  tone = 'neutral',
  selected = false,
  onPress,
  leading,
  style,
  accessibilityLabel,
  testID,
}: ChipProps): React.JSX.Element {
  const theme = useTheme();
  const { focused, onFocus, onBlur } = useFocusState();
  const { colors } = theme;

  const toneColors: Record<ChipTone, { bg: string; fg: string }> = {
    neutral: { bg: colors.surfaceSunken, fg: colors.text },
    brand: { bg: colors.brand, fg: colors.onBrand },
    brandTint: { bg: colors.brandTint, fg: colors.brandInk },
    success: { bg: colors.successTint, fg: colors.successInk },
    danger: { bg: colors.dangerTint, fg: colors.dangerInk },
  };
  const palette = toneColors[selected ? 'brand' : tone];

  const pill = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: VISUAL_MIN_HEIGHT,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.radius.pill,
        borderWidth: 2,
        borderColor: onPress && focused ? colors.focusRing : 'transparent',
        backgroundColor: palette.bg,
      }}
    >
      <Text
        maxFontSizeMultiplier={1.3}
        style={{ ...theme.typography.smallStrong, color: palette.fg }}
      >
        {leading ? `${leading} ${label}` : label}
      </Text>
    </View>
  );

  if (!onPress) {
    return (
      <View testID={testID} accessibilityLabel={accessibilityLabel ?? label} style={style}>
        {pill}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected }}
      onPress={onPress}
      onFocus={onFocus}
      onBlur={onBlur}
      testID={testID}
      style={[{ minHeight: theme.touch.min, justifyContent: 'center' }, style]}
    >
      {pill}
    </Pressable>
  );
}

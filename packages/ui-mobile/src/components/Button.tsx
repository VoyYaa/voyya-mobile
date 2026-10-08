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
import { useReducedMotion } from '../hooks/useReducedMotion';
import { withAlpha } from '../utils/color';
import { BrandSpinner } from './brand/BrandSpinner';

export type ButtonVariant = 'primary' | 'secondary' | 'go' | 'ghost' | 'danger' | 'ghostOnStage';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonLeading = React.ReactNode | ((color: string) => React.ReactNode);

export interface ButtonProps {
  label: string;
  leading?: ButtonLeading;
  onPress: (event: GestureResponderEvent) => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
  accessibilityLabel?: string;
  testID?: string;
}

interface ButtonPalette {
  bg: string;
  bgPressed: string;
  fg: string;
  border: string;
  ledge?: string;
}

const HEIGHT_BY_SIZE: Record<ButtonSize, number> = { sm: 44, md: 52, lg: 60 };
const LEDGE_WIDTH = 3;
const PRESSED_LEDGE_WIDTH = 1;

export function Button({
  label,
  leading,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  loadingLabel,
  style,
  accessibilityHint,
  accessibilityLabel,
  testID,
}: ButtonProps): React.JSX.Element {
  const theme = useTheme();
  const reduced = useReducedMotion();
  const { focused, onFocus, onBlur } = useFocusState();
  const isDisabled = disabled || loading;
  const { colors } = theme;

  const palettes: Record<ButtonVariant, ButtonPalette> = {
    primary: {
      bg: colors.brand,
      bgPressed: colors.brandPressed,
      fg: colors.onBrand,
      border: 'transparent',
      ledge: colors.brandLedge,
    },
    secondary: {
      bg: colors.stage,
      bgPressed: colors.stageRaised,
      fg: colors.onStage,
      border: colors.stageLine,
    },
    go: {
      bg: colors.success,
      bgPressed: colors.successSolid,
      fg: colors.onSuccess,
      border: 'transparent',
    },
    ghost: {
      bg: 'transparent',
      bgPressed: colors.brandTint,
      fg: colors.text,
      border: colors.borderStrong,
    },
    danger: {
      bg: colors.dangerSolid,
      bgPressed: colors.dangerInk,
      fg: colors.onDanger,
      border: 'transparent',
    },
    ghostOnStage: {
      bg: 'transparent',
      bgPressed: colors.stageLine,
      fg: colors.onStage,
      border: withAlpha(colors.onStage, 0.5),
    },
  };
  const palette = palettes[variant];
  const hasLedge = palette.ledge !== undefined;
  const minHeight = HEIGHT_BY_SIZE[size];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel ?? label}
      disabled={isDisabled}
      onPress={onPress}
      onFocus={onFocus}
      onBlur={onBlur}
      testID={testID}
      style={({ pressed }) => {
        const isPressed = pressed && !isDisabled;
        const borderColor = focused ? colors.focusRing : palette.border;
        return [
          {
            minHeight,
            borderRadius: theme.radius.button,
            backgroundColor: isPressed ? palette.bgPressed : palette.bg,
            borderWidth: 2,
            borderColor,
            borderBottomWidth: hasLedge ? (isPressed ? PRESSED_LEDGE_WIDTH : LEDGE_WIDTH) : 2,
            borderBottomColor: focused ? colors.focusRing : (palette.ledge ?? borderColor),
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            paddingHorizontal: theme.spacing.lg,
            opacity: isDisabled && !loading ? 0.5 : 1,
            transform: [{ translateY: isPressed && hasLedge && !reduced ? 2 : 0 }],
          },
          focused
            ? {
                shadowColor: colors.brand,
                shadowOpacity: 0.45,
                shadowRadius: 4,
                shadowOffset: { width: 0, height: 0 },
              }
            : null,
          style,
        ];
      }}
    >
      {loading && (
        <View style={{ marginRight: theme.spacing.sm }}>
          <BrandSpinner size={20} color={palette.fg} />
        </View>
      )}
      {!loading && leading != null && (
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={{ marginRight: theme.spacing.sm }}
        >
          {typeof leading === 'function' ? leading(palette.fg) : leading}
        </View>
      )}
      <Text
        maxFontSizeMultiplier={1.3}
        style={{ ...theme.typography.button, color: palette.fg }}
        numberOfLines={1}
      >
        {loading && loadingLabel ? loadingLabel : label}
      </Text>
    </Pressable>
  );
}

// =============================================================================
// VoyYa — Button (packages/ui-mobile)
// -----------------------------------------------------------------------------
// Variantes: primary (ámbar/marca), go (verde/éxito), ghost (transparente).
// ≥44px táctil (usa 48px por defecto), estados disabled/loading. Texto SIEMPRE
// con contraste válido sobre el fondo del botón (espresso sobre ámbar, nunca
// blanco — no alcanza 4.5:1 sobre #F4A21A; ver CLAUDE.md/dirección de diseño).
// =============================================================================

import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../theme';

export type ButtonVariant = 'primary' | 'go' | 'ghost';

export interface ButtonProps {
  label: string;
  onPress: (event: GestureResponderEvent) => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  /** Texto alterno mientras `loading` (ej. "Aceptando…", "Cancelando…"). */
  loadingLabel?: string;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
  testID?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  loadingLabel,
  style,
  accessibilityHint,
  testID,
}: ButtonProps): React.JSX.Element {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  const palette = {
    primary: {
      bg: theme.colors.brand,
      bgPressed: theme.colors.brandPressed,
      fg: theme.colors.onBrand,
      border: 'transparent',
    },
    go: {
      bg: theme.colors.success,
      bgPressed: theme.colors.success,
      fg: theme.colors.onSuccess,
      border: 'transparent',
    },
    ghost: {
      bg: 'transparent',
      bgPressed: theme.colors.surfaceAlt,
      fg: theme.colors.text,
      border: theme.colors.border,
    },
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      accessibilityHint={accessibilityHint}
      disabled={isDisabled}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        {
          minHeight: theme.touch.min + 4, // 48px — cubre el ≥44 con margen cómodo
          borderRadius: theme.radius.button,
          backgroundColor: pressed && !isDisabled ? palette.bgPressed : palette.bg,
          borderWidth: variant === 'ghost' ? 1 : 0,
          borderColor: palette.border,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          paddingHorizontal: theme.spacing.lg,
          opacity: isDisabled && !loading ? 0.5 : 1,
        },
        style,
      ]}
    >
      {loading && (
        <ActivityIndicator size="small" color={palette.fg} style={{ marginRight: theme.spacing.sm }} />
      )}
      <Text style={{ ...theme.typography.button, color: palette.fg }} numberOfLines={1}>
        {loading && loadingLabel ? loadingLabel : label}
      </Text>
    </Pressable>
  );
}

// =============================================================================
// VoyYa — TextField (packages/ui-mobile)
// -----------------------------------------------------------------------------
// Campo de texto base accesible: label, error, adornos, toggle mostrar/ocultar.
// Primer campo de texto real del design system (docs/VoyYa/ux/auth-login-otp.md
// §2.1, decisión D-A07) — lo usan teléfono/OTP (pasajero) y cédula/PIN
// (conductor). `autoComplete`/`textContentType` son *passthrough* directo del
// `TextInput` de RN (se reusa el tipo de RN, no se redefine): NUNCA se fuerza
// "off" — rompería autocompletar/gestores de contraseña (ver §6.3 de la spec).
// =============================================================================

import React, { useState } from 'react';
import {
  Pressable,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../theme';

export type TextFieldKeyboardType = 'default' | 'numeric' | 'email-address';

export interface TextFieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: TextFieldKeyboardType;
  /** PIN/contraseña. */
  secureTextEntry?: boolean;
  /** Si `true` + `secureTextEntry`: agrega toggle "Mostrar/Ocultar" (≥44px vía `hitSlop`). */
  revealable?: boolean;
  maxLength?: number;
  /** Presente → borde+texto en `color.danger`, anunciado como alerta bajo el campo. */
  error?: string;
  disabled?: boolean;
  /** Ej. chip fijo "+57" en el campo de teléfono. */
  leadingAdornment?: React.ReactNode;
  autoFocus?: boolean;
  autoComplete?: TextInputProps['autoComplete'];
  textContentType?: TextInputProps['textContentType'];
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  secureTextEntry = false,
  revealable = false,
  maxLength,
  error,
  disabled = false,
  leadingAdornment,
  autoFocus,
  autoComplete,
  textContentType,
  accessibilityHint,
  style,
  testID,
}: TextFieldProps): React.JSX.Element {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const isNumeric = keyboardType === 'numeric';
  // `typography.numeric` es agnóstico de tamaño (solo tabular-nums + peso) — se
  // le da un tamaño explícito aquí; el resto de campos hereda `body` tal cual.
  const valueStyle = isNumeric ? { ...theme.typography.numeric, fontSize: 18 } : theme.typography.body;

  const borderColor = error ? theme.colors.danger : focused ? theme.colors.brandPressed : theme.colors.border;
  // RN no tiene `outline-offset`: el foco (spec: "2px, offset 2px") se aproxima
  // solo con el grosor de borde — misma limitación ya documentada en
  // app/destino.tsx para aria-invalid/aria-describedby (sin 1:1 en RN).
  const borderWidth = focused || error ? 2 : 1;

  return (
    <View style={style}>
      <Text style={{ ...theme.typography.small, color: theme.colors.textMuted, marginBottom: theme.spacing.xs }}>
        {label}
      </Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          minHeight: theme.touch.min,
          borderWidth,
          borderColor,
          borderRadius: theme.radius.field,
          paddingHorizontal: theme.spacing.md,
          backgroundColor: theme.colors.surface,
          opacity: disabled ? 0.5 : 1,
        }}
      >
        {leadingAdornment && <View style={{ marginRight: theme.spacing.sm }}>{leadingAdornment}</View>}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textMuted}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry && !revealed}
          maxLength={maxLength}
          editable={!disabled}
          autoFocus={autoFocus}
          autoComplete={autoComplete}
          textContentType={textContentType}
          accessibilityLabel={label}
          accessibilityHint={accessibilityHint}
          accessibilityState={{ disabled }}
          testID={testID}
          style={{
            flex: 1,
            minHeight: theme.touch.min - 2,
            paddingVertical: 0,
            color: theme.colors.text,
            ...valueStyle,
          }}
        />
        {secureTextEntry && revealable && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={revealed ? `Ocultar ${label}` : `Mostrar ${label}`}
            hitSlop={12}
            onPress={() => setRevealed((v) => !v)}
            style={{
              minWidth: theme.touch.min,
              minHeight: theme.touch.min,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ ...theme.typography.small, fontWeight: '700', color: theme.colors.brandPressed }}>
              {revealed ? 'Ocultar' : 'Mostrar'}
            </Text>
          </Pressable>
        )}
      </View>
      {error && (
        // RN no tiene aria-invalid/aria-describedby 1:1 (mismo criterio que
        // app/destino.tsx): `accessibilityRole="alert"` en el propio texto de
        // error es la forma idiomática de anunciarlo, exige corregir ya (§1).
        <Text
          accessibilityRole="alert"
          style={{ ...theme.typography.small, color: theme.colors.danger, marginTop: theme.spacing.xs }}
        >
          {error}
        </Text>
      )}
    </View>
  );
}

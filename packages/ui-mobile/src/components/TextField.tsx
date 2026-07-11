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
  secureTextEntry?: boolean;
  revealable?: boolean;
  maxLength?: number;
  error?: string;
  disabled?: boolean;
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
  const valueStyle = isNumeric ? { ...theme.typography.numeric, fontSize: 18 } : theme.typography.body;

  const borderColor = error ? theme.colors.danger : focused ? theme.colors.brandPressed : theme.colors.border;
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

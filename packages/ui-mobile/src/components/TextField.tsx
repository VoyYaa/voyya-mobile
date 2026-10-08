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
import { uiCopy } from '../copy';
import { useFocusState } from '../hooks/useFocusState';
import { BrandSpinner } from './brand/BrandSpinner';
import { MarkGlyph } from './brand/MarkGlyph';

export type TextFieldKeyboardType =
  'default' | 'numeric' | 'email-address' | 'phone-pad' | 'number-pad';

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
  helper?: string;
  loading?: boolean;
  disabled?: boolean;
  leadingAdornment?: React.ReactNode;
  autoFocus?: boolean;
  autoComplete?: TextInputProps['autoComplete'];
  textContentType?: TextInputProps['textContentType'];
  returnKeyType?: TextInputProps['returnKeyType'];
  onSubmitEditing?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const NUMERIC_KEYBOARDS: readonly TextFieldKeyboardType[] = ['numeric', 'number-pad', 'phone-pad'];

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
  helper,
  loading = false,
  disabled = false,
  leadingAdornment,
  autoFocus,
  autoComplete,
  textContentType,
  returnKeyType,
  onSubmitEditing,
  accessibilityLabel,
  accessibilityHint,
  style,
  testID,
}: TextFieldProps): React.JSX.Element {
  const theme = useTheme();
  const { focused, onFocus, onBlur } = useFocusState();
  const [revealed, setRevealed] = useState(false);
  const { colors } = theme;

  const isNumeric = NUMERIC_KEYBOARDS.includes(keyboardType);
  const valueStyle = isNumeric
    ? { ...theme.typography.numeric, fontSize: 18 }
    : theme.typography.body;

  const borderColor = error ? colors.danger : focused ? colors.focusRing : colors.borderStrong;
  const borderWidth = focused || error ? 2 : 1.5;
  const halo =
    focused && !error
      ? {
          shadowColor: colors.brand,
          shadowOpacity: 0.45,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 0 },
        }
      : null;

  return (
    <View style={style}>
      <Text
        style={{
          ...theme.typography.smallStrong,
          color: colors.textMuted,
          marginBottom: theme.spacing.xs,
        }}
      >
        {label}
      </Text>
      <View
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            minHeight: theme.touch.comfortable,
            borderWidth,
            borderColor,
            borderRadius: theme.radius.field,
            backgroundColor: colors.surface,
            opacity: disabled ? 0.5 : 1,
          },
          halo,
        ]}
      >
        {leadingAdornment && (
          <View
            style={{
              alignSelf: 'stretch',
              justifyContent: 'center',
              paddingHorizontal: theme.spacing.md,
              backgroundColor: colors.surfaceSunken,
              borderTopLeftRadius: theme.radius.field - borderWidth,
              borderBottomLeftRadius: theme.radius.field - borderWidth,
              borderRightWidth: 1,
              borderRightColor: colors.border,
            }}
          >
            {leadingAdornment}
          </View>
        )}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={placeholder}
          placeholderTextColor={colors.textSubtle}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry && !revealed}
          maxLength={maxLength}
          editable={!disabled}
          autoFocus={autoFocus}
          autoComplete={autoComplete}
          textContentType={textContentType}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          accessibilityLabel={accessibilityLabel ?? label}
          accessibilityHint={accessibilityHint}
          accessibilityState={{ disabled, busy: loading }}
          testID={testID}
          style={{
            flex: 1,
            minHeight: theme.touch.comfortable - 4,
            paddingVertical: 0,
            paddingHorizontal: theme.spacing.md,
            color: colors.text,
            ...valueStyle,
          }}
        />
        {loading && (
          <View style={{ paddingRight: theme.spacing.md }}>
            <BrandSpinner size={20} />
          </View>
        )}
        {secureTextEntry && revealable && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={revealed ? `${uiCopy.hide} ${label}` : `${uiCopy.show} ${label}`}
            onPress={() => setRevealed((previous) => !previous)}
            style={{
              minWidth: theme.touch.min,
              minHeight: theme.touch.min,
              paddingHorizontal: theme.spacing.sm,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ ...theme.typography.smallStrong, color: colors.brandInk }}>
              {revealed ? uiCopy.hide : uiCopy.show}
            </Text>
          </Pressable>
        )}
      </View>
      {error ? (
        <View
          accessibilityRole="alert"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.spacing.xs,
            marginTop: theme.spacing.xs,
          }}
        >
          <MarkGlyph glyph="error" size={16} />
          <Text style={{ ...theme.typography.small, color: colors.dangerInk, flex: 1 }}>
            {error}
          </Text>
        </View>
      ) : helper ? (
        <Text
          style={{
            ...theme.typography.small,
            color: colors.textSubtle,
            marginTop: theme.spacing.xs,
          }}
        >
          {helper}
        </Text>
      ) : null}
    </View>
  );
}

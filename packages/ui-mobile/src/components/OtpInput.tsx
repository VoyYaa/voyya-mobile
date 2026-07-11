import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, TextInput, View } from 'react-native';
import { useTheme } from '../theme';

export type OtpInputStatus = 'editing' | 'verifying' | 'error' | 'success';

export interface OtpInputProps {
  length?: number;
  value: string;
  onChangeValue: (value: string) => void;
  onComplete?: (value: string) => void;
  status: OtpInputStatus;
  disabled?: boolean;
  reducedMotion?: boolean;
  autoFocus?: boolean;
  accessibilityLabel?: string;
  testID?: string;
}

const BOX_SIZE = 52;
const ERROR_CLEAR_DELAY_MS = 600;
const SHAKE_STEP_MS = 60;

export function OtpInput({
  length = 4,
  value,
  onChangeValue,
  onComplete,
  status,
  disabled = false,
  reducedMotion = false,
  autoFocus = false,
  accessibilityLabel,
  testID,
}: OtpInputProps): React.JSX.Element {
  const theme = useTheme();
  const inputRef = useRef<TextInput>(null);
  const completedRef = useRef(false);
  const [focused, setFocused] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const onChangeValueRef = useRef(onChangeValue);
  onChangeValueRef.current = onChangeValue;
  const reducedMotionRef = useRef(reducedMotion);
  reducedMotionRef.current = reducedMotion;

  const handleChangeText = (raw: string): void => {
    const digits = raw.replace(/[^0-9]/g, '').slice(0, length);
    onChangeValue(digits);
    if (digits.length === length) {
      if (!completedRef.current) {
        completedRef.current = true;
        onComplete?.(digits);
      }
    } else {
      completedRef.current = false;
    }
  };

  useEffect(() => {
    if (status !== 'error') return;
    if (!reducedMotionRef.current) {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 1, duration: SHAKE_STEP_MS, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -1, duration: SHAKE_STEP_MS, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 1, duration: SHAKE_STEP_MS, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: SHAKE_STEP_MS, useNativeDriver: true }),
      ]).start();
    }
    const timer = setTimeout(() => {
      completedRef.current = false;
      onChangeValueRef.current('');
      inputRef.current?.focus();
    }, ERROR_CLEAR_DELAY_MS);
    return () => clearTimeout(timer);
  }, [status, shakeAnim]);

  const digitColor =
    status === 'error' ? theme.colors.danger : status === 'success' ? theme.colors.success : theme.colors.text;

  const boxes = Array.from({ length }, (_, index) => {
    const digit = value[index];
    const isCursor = focused && status === 'editing' && index === value.length;
    const borderColor =
      status === 'error'
        ? theme.colors.danger
        : status === 'success'
          ? theme.colors.success
          : isCursor || digit
            ? theme.colors.brandPressed
            : theme.colors.border;

    return (
      <View
        key={index}
        style={{
          width: BOX_SIZE,
          height: BOX_SIZE + 4,
          borderWidth: isCursor ? 2 : 1,
          borderColor,
          borderRadius: theme.radius.field,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.surface,
        }}
      >
        <Text style={{ ...theme.typography.numeric, fontSize: 24, color: digitColor }}>{digit ?? ''}</Text>
      </View>
    );
  });

  return (
    <View testID={testID} style={{ alignSelf: 'flex-start', position: 'relative' }}>
      <Animated.View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{
          flexDirection: 'row',
          gap: theme.spacing.sm as number,
          transform: [
            { translateX: shakeAnim.interpolate({ inputRange: [-1, 0, 1], outputRange: [-6, 0, 6] }) },
          ],
        }}
      >
        {boxes}
      </Animated.View>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        editable={!disabled}
        autoFocus={autoFocus}
        keyboardType="number-pad"
        maxLength={length}
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        accessibilityLabel={accessibilityLabel ?? `Código de verificación de ${length} dígitos`}
        accessibilityValue={{ text: `${value.length} de ${length} dígitos ingresados` }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0 }}
      />
    </View>
  );
}

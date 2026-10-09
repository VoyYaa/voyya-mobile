import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, TextInput, View } from 'react-native';
import { useTheme } from '../theme';
import { USE_NATIVE_DRIVER, motion } from '../tokens';
import { uiCopy } from '../copy';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useLoopValue } from '../motion/useLoopValue';
import { MarkGlyph } from './brand/MarkGlyph';

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
  autofill?: boolean;
  accessibilityLabel?: string;
  testID?: string;
}

const BOX_WIDTH = 56;
const BOX_HEIGHT = 64;
const BOX_GAP = 10;
const ERROR_CLEAR_DELAY_MS = 600;
const SHAKE_STEP_MS = 60;
const STAGGER_MS = 40;
const POP_FROM_SCALE = 1.08;
const POP_MS = 120;
const CARET_PERIOD_MS = 1060;
const WAVE_PERIOD_MS = 900;

interface OtpBoxProps {
  digit: string | undefined;
  index: number;
  isCursor: boolean;
  status: OtpInputStatus;
  reduced: boolean;
}

function OtpBox({ digit, index, isCursor, status, reduced }: OtpBoxProps): React.JSX.Element {
  const theme = useTheme();
  const { colors } = theme;
  const pop = useRef(new Animated.Value(1)).current;
  const previousDigit = useRef(digit);
  const [successShown, setSuccessShown] = useState(false);
  const wave = useLoopValue(status === 'verifying' && !reduced, {
    durationMs: WAVE_PERIOD_MS,
    easing: motion.ease.inOut,
    delayMs: index * STAGGER_MS,
  });
  const caret = useLoopValue(isCursor && !reduced, { durationMs: CARET_PERIOD_MS });

  useEffect(() => {
    const wasEmpty = previousDigit.current === undefined;
    previousDigit.current = digit;
    if (digit === undefined || !wasEmpty || reduced) return;
    pop.setValue(POP_FROM_SCALE);
    const animation = Animated.timing(pop, {
      toValue: 1,
      duration: POP_MS,
      easing: motion.ease.out,
      useNativeDriver: USE_NATIVE_DRIVER,
    });
    animation.start();
    return () => animation.stop();
  }, [digit, reduced, pop]);

  useEffect(() => {
    if (status !== 'success') {
      setSuccessShown(false);
      return;
    }
    const timer = setTimeout(() => setSuccessShown(true), reduced ? 0 : index * STAGGER_MS);
    return () => clearTimeout(timer);
  }, [status, index, reduced]);

  const waveScale = wave.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.06, 1] });
  const caretOpacity = reduced
    ? 1
    : caret.interpolate({ inputRange: [0, 0.49, 0.5, 0.99, 1], outputRange: [1, 1, 0, 0, 1] });

  const isError = status === 'error';
  const borderColor = isError
    ? colors.danger
    : successShown
      ? colors.success
      : isCursor || digit
        ? colors.focusRing
        : colors.borderStrong;
  const emphasized = isError || successShown || isCursor;
  const digitColor = isError ? colors.dangerInk : successShown ? colors.successInk : colors.text;

  return (
    <Animated.View
      style={{
        width: BOX_WIDTH,
        height: BOX_HEIGHT,
        borderWidth: emphasized ? 2 : 1.5,
        borderColor,
        borderRadius: theme.radius.field,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: successShown ? colors.successTint : colors.surface,
        transform: [{ scale: Animated.multiply(pop, waveScale) }],
      }}
    >
      {digit !== undefined ? (
        <Text style={{ ...theme.typography.numeric, fontSize: 28, color: digitColor }}>
          {digit}
        </Text>
      ) : (
        isCursor && (
          <Animated.View
            style={{ width: 2, height: 28, backgroundColor: colors.text, opacity: caretOpacity }}
          />
        )
      )}
    </Animated.View>
  );
}

export function OtpInput({
  length = 4,
  value,
  onChangeValue,
  onComplete,
  status,
  disabled = false,
  reducedMotion = false,
  autoFocus = false,
  autofill = true,
  accessibilityLabel,
  testID,
}: OtpInputProps): React.JSX.Element {
  const theme = useTheme();
  const hookReduced = useReducedMotion();
  const reduced = reducedMotion || hookReduced;
  const inputRef = useRef<TextInput>(null);
  const completedRef = useRef(false);
  const [focused, setFocused] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const onChangeValueRef = useRef(onChangeValue);
  onChangeValueRef.current = onChangeValue;
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;

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
    if (!reducedRef.current) {
      Animated.sequence([
        Animated.timing(shakeAnim, {
          toValue: 1,
          duration: SHAKE_STEP_MS,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(shakeAnim, {
          toValue: -1,
          duration: SHAKE_STEP_MS,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(shakeAnim, {
          toValue: 1,
          duration: SHAKE_STEP_MS,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(shakeAnim, {
          toValue: 0,
          duration: SHAKE_STEP_MS,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ]).start();
    }
    const timer = setTimeout(() => {
      completedRef.current = false;
      onChangeValueRef.current('');
      inputRef.current?.focus();
    }, ERROR_CLEAR_DELAY_MS);
    return () => clearTimeout(timer);
  }, [status, shakeAnim]);

  const boxes = Array.from({ length }, (_, index) => (
    <OtpBox
      key={index}
      index={index}
      digit={value[index]}
      isCursor={focused && status === 'editing' && index === value.length}
      status={status}
      reduced={reduced}
    />
  ));

  return (
    <View testID={testID} style={{ alignSelf: 'center', position: 'relative' }}>
      <Animated.View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{
          flexDirection: 'row',
          gap: BOX_GAP,
          transform: [
            {
              translateX: shakeAnim.interpolate({
                inputRange: [-1, 0, 1],
                outputRange: [-6, 0, 6],
              }),
            },
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
        textContentType={autofill ? 'oneTimeCode' : 'none'}
        autoComplete={autofill ? 'sms-otp' : 'off'}
        importantForAutofill={autofill ? 'auto' : 'no'}
        accessibilityLabel={accessibilityLabel ?? `Código de verificación de ${length} dígitos`}
        accessibilityValue={{ text: `${value.length} de ${length} dígitos ingresados` }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0 }}
      />
      {status === 'success' && (
        <View
          accessibilityLabel={uiCopy.otpSuccess}
          style={{ alignItems: 'center', marginTop: theme.spacing.sm }}
        >
          <MarkGlyph glyph="success" size={28} animate />
        </View>
      )}
    </View>
  );
}

// =============================================================================
// VoyYa — OtpInput (packages/ui-mobile)
// -----------------------------------------------------------------------------
// 4 casillas decorativas + un único TextInput accesible oculto que concentra el
// foco/teclado/autocompletado (docs/VoyYa/ux/auth-login-otp.md §2.2 — nota de
// implementación recomendada): repartir el foco entre 4 TextInput reales sería
// más frágil (peor soporte de pegado/autocompletado de SMS).
//
// CONTROLADO y PRESENTACIONAL puro — mismo contrato que CountdownRing.tsx:
// `status` lo decide la PANTALLA según la respuesta del servidor, este
// componente solo pinta lo que recibe. Las micro-interacciones de shake/auto-
// clear en `error` (~300/600ms) SÍ son propias del componente (fijas, de UI
// local — igual que el auto-hide por `setTimeout` de Toast.tsx; no son un
// countdown de negocio como el TTL del OTP, que vive en la pantalla).
// =============================================================================

import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, TextInput, View } from 'react-native';
import { useTheme } from '../theme';

export type OtpInputStatus = 'editing' | 'verifying' | 'error' | 'success';

export interface OtpInputProps {
  /** Default 4 (decisión de producto D-A02) — no un parámetro de `parametros_sistema`. */
  length?: number;
  value: string;
  onChangeValue: (value: string) => void;
  /** Se dispara UNA sola vez al llegar a `length` dígitos (tecleo o autocompletado de SMS). */
  onComplete?: (value: string) => void;
  status: OtpInputStatus;
  /** `true` en `verifying` y `success` (lo decide la pantalla). */
  disabled?: boolean;
  /** Sin shake ni animación: solo cambio estático de color (misma convención que CountdownRing/Skeleton). */
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

  // Refs "en vivo": el efecto de `error` de abajo depende solo de `status`, no
  // de estas dos props (evita reprogramar el timer de 600ms en cada render del
  // llamador solo porque le pasó una nueva identidad de función/valor).
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

  // `error`: sacudida breve + auto-clear + refoco a la primera casilla, UNA vez
  // por transición a `error` — mismo patrón de "ref de un solo disparo" que
  // `expireFired`/`warnAnnounced` en CountdownRing.tsx.
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
      {/* TextInput real, invisible pero encima de las casillas: concentra foco,
          teclado numérico y autocompletado de SMS. Las casillas de arriba son
          puramente decorativas (accessibilityElementsHidden). */}
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

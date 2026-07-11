import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, TextField, useTheme } from '@voyyaa/ui-mobile';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { useRequestOtp } from '../../src/hooks/useRequestOtp';
import { useNetworkStatus } from '../../src/hooks/useNetworkStatus';
import { useCountdown } from '../../src/hooks/useCountdown';
import { domainErrorCode, retryInSecOf } from '../../src/api/errors';

function formatMMSS(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const RATE_LIMIT_FALLBACK_SEC = 90;

export default function PhoneScreen(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const networkStatus = useNetworkStatus();
  const requestOtp = useRequestOtp();

  const [digits, setDigits] = useState('');
  const [errorInline, setErrorInline] = useState<string | undefined>(undefined);
  const [rateLimitDeadline, setRateLimitDeadline] = useState<string | null>(null);
  const [rateLimitTimeKnown, setRateLimitTimeKnown] = useState(true);

  const rateLimitRemaining = useCountdown(rateLimitDeadline);
  const isRateLimited = rateLimitDeadline !== null && rateLimitRemaining > 0;
  const isFormatValid = digits.length === 10;
  const offline = networkStatus === 'offline';

  const handleChangeDigits = (raw: string): void => {
    setErrorInline(undefined);
    setDigits(raw.replace(/[^0-9]/g, '').slice(0, 10));
  };

  const handleSubmit = (): void => {
    if (!isFormatValid || offline || requestOtp.isPending) return;
    const phone = `+57${digits}`;
    requestOtp.mutate(
      { phone },
      {
        onSuccess: (response) => {
          const resendAtIso = new Date(Date.now() + response.resend_in_sec * 1000).toISOString();
          router.push({ pathname: '/(auth)/otp', params: { phone, resendAtIso } });
        },
        onError: (error) => {
          if (domainErrorCode(error) === 'OTP_RATE_LIMIT') {
            const sec = retryInSecOf(error);
            setRateLimitTimeKnown(sec !== undefined);
            setRateLimitDeadline(new Date(Date.now() + (sec ?? RATE_LIMIT_FALLBACK_SEC) * 1000).toISOString());
          } else {
            setErrorInline('Ese número no parece válido. Verifica que sean 10 dígitos de un celular.');
          }
        },
      },
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <ScreenHeader title="Ingresar" hideBack />
      <View style={{ padding: theme.spacing.lg, gap: theme.spacing.lg as number }}>
        <Text style={{ ...theme.typography.body, color: theme.colors.textMuted }}>
          Te enviaremos un código por SMS para confirmar tu número.
        </Text>

        <TextField
          label="Número de celular"
          value={digits}
          onChangeText={handleChangeDigits}
          placeholder="300 123 4567"
          keyboardType="numeric"
          maxLength={10}
          disabled={requestOtp.isPending || isRateLimited}
          leadingAdornment={<Text style={{ ...theme.typography.body, color: theme.colors.textMuted }}>+57</Text>}
          error={errorInline}
          autoComplete="tel"
          textContentType="telephoneNumber"
          testID="telefono-input"
        />

        {isRateLimited ? (
          <View
            accessibilityRole="alert"
            style={{
              backgroundColor: theme.colors.surfaceAlt,
              borderRadius: theme.radius.card,
              padding: theme.spacing.lg,
              gap: theme.spacing.xs as number,
            }}
          >
            <Text style={{ ...theme.typography.subtitle, color: theme.colors.text }}>Ya pediste varios códigos</Text>
            <Text style={{ ...theme.typography.body, color: theme.colors.textMuted }}>
              {rateLimitTimeKnown
                ? `Por seguridad, espera ${formatMMSS(rateLimitRemaining)} antes de solicitar uno nuevo.`
                : 'Espera unos minutos antes de intentar de nuevo.'}
            </Text>
          </View>
        ) : (
          <Button
            label="Enviar código"
            onPress={handleSubmit}
            disabled={!isFormatValid || offline}
            loading={requestOtp.isPending}
            loadingLabel="Enviando…"
            accessibilityHint={offline ? 'Sin conexión, no se puede enviar el código ahora' : undefined}
            testID="enviar-codigo-button"
          />
        )}

        {offline && !isRateLimited && (
          <Text style={{ ...theme.typography.small, color: theme.colors.textMuted }}>
            Sin conexión · no se puede enviar el código ahora.
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

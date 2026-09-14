import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, OtpInput, Toast, useTheme, type OtpInputStatus } from '@voyyaa/ui-mobile';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { useVerifyOtp } from '../../src/hooks/useVerifyOtp';
import { useRequestOtp } from '../../src/hooks/useRequestOtp';
import { useCountdown } from '../../src/hooks/useCountdown';
import { useSessionStore } from '../../src/state/useSessionStore';
import { domainErrorCode, isNetworkError, retryInSecOf } from '../../src/api/errors';

type VerifyOutcome = 'idle' | 'verifying' | 'incorrect' | 'expired' | 'offline' | 'success';

const ANNOUNCE_MESSAGES: Record<VerifyOutcome, string | null> = {
  idle: null,
  verifying: 'Verificando código.',
  incorrect: 'Código incorrecto. Inténtalo de nuevo.',
  expired: 'Este código venció. Solicita uno nuevo.',
  offline: 'Sin conexión, no pudimos verificar tu código.',
  success: 'Código verificado.',
};

function formatMMSS(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const RATE_LIMIT_FALLBACK_SEC = 90;

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const local = digits.startsWith('57') ? digits.slice(2) : digits;
  return `+57 ${local.slice(0, 3)} ··· ··${local.slice(-2)}`;
}

function toOtpStatus(outcome: VerifyOutcome): OtpInputStatus {
  switch (outcome) {
    case 'verifying':
      return 'verifying';
    case 'incorrect':
      return 'error';
    case 'success':
      return 'success';
    default:
      return 'editing';
  }
}

interface ResendAreaProps {
  isRateLimited: boolean;
  rateLimitRemaining: number;
  rateLimitTimeKnown: boolean;
  canResend: boolean;
  resending: boolean;
  resendRemaining: number;
  onResend: () => void;
}

function ResendArea({
  isRateLimited,
  rateLimitRemaining,
  rateLimitTimeKnown,
  canResend,
  resending,
  resendRemaining,
  onResend,
}: ResendAreaProps): React.JSX.Element {
  const theme = useTheme();

  if (isRateLimited) {
    return (
      <View
        accessibilityRole="alert"
        style={{
          backgroundColor: theme.colors.surfaceAlt,
          borderRadius: theme.radius.card,
          padding: theme.spacing.lg,
        }}
      >
        <Text style={{ ...theme.typography.small, color: theme.colors.text }}>
          {rateLimitTimeKnown
            ? `Ya pediste varios códigos · espera ${formatMMSS(rateLimitRemaining)} antes de pedir otro.`
            : 'Ya pediste varios códigos · espera unos minutos antes de pedir otro.'}
        </Text>
      </View>
    );
  }

  if (canResend) {
    return (
      <Pressable accessibilityRole="link" hitSlop={12} onPress={onResend}>
        <Text
          style={{ ...theme.typography.small, fontWeight: '700', color: theme.colors.brandPressed }}
        >
          {resending ? 'Reenviando…' : 'Reenviar código'}
        </Text>
      </Pressable>
    );
  }

  return (
    <Text style={{ ...theme.typography.small, fontWeight: '700', color: theme.colors.textMuted }}>
      Reenviar código en {resendRemaining} s
    </Text>
  );
}

export default function OtpScreen(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ phone: string; resendAtIso: string }>();
  const setSession = useSessionStore((s) => s.setSession);

  const verifyOtp = useVerifyOtp();
  const resendOtp = useRequestOtp();

  const [value, setValue] = useState('');
  const [outcome, setOutcome] = useState<VerifyOutcome>('idle');
  const [resendDeadline, setResendDeadline] = useState<string | null>(params.resendAtIso ?? null);
  const [rateLimitDeadline, setRateLimitDeadline] = useState<string | null>(null);
  const [rateLimitTimeKnown, setRateLimitTimeKnown] = useState(true);
  const [toastVisible, setToastVisible] = useState(false);

  const resendRemaining = useCountdown(resendDeadline);
  const rateLimitRemaining = useCountdown(rateLimitDeadline);
  const isRateLimited = rateLimitDeadline !== null && rateLimitRemaining > 0;
  const canResend = !isRateLimited && (outcome === 'expired' || resendRemaining <= 0);

  const previousOutcome = useRef<VerifyOutcome | null>(null);
  const canResendAnnounced = useRef(false);

  useEffect(() => {
    if (!params.phone) router.replace('/(auth)/phone');
  }, [params.phone, router]);

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(
      `Código enviado a ${maskPhone(params.phone ?? '')}. Ingresa los 4 dígitos.`,
    );
  }, []);

  useEffect(() => {
    if (previousOutcome.current === outcome) return;
    previousOutcome.current = outcome;
    const message = ANNOUNCE_MESSAGES[outcome];
    if (message) AccessibilityInfo.announceForAccessibility(message);
  }, [outcome]);

  useEffect(() => {
    if (canResend && !canResendAnnounced.current) {
      canResendAnnounced.current = true;
      AccessibilityInfo.announceForAccessibility('Ya puedes reenviar el código.');
    } else if (!canResend) {
      canResendAnnounced.current = false;
    }
  }, [canResend]);

  useEffect(() => {
    if (outcome !== 'incorrect' && outcome !== 'offline') return;
    setOutcome('idle');
  }, [value]);

  const handleComplete = (code: string): void => {
    setOutcome('verifying');
    verifyOtp.mutate(
      { phone: params.phone, code },
      {
        onSuccess: (response) => {
          void setSession(response).then(() => {
            setOutcome('success');
            setTimeout(() => router.replace('/'), 500);
          });
        },
        onError: (error) => {
          if (isNetworkError(error)) {
            setOutcome('offline');
            return;
          }
          setOutcome(domainErrorCode(error) === 'OTP_EXPIRED' ? 'expired' : 'incorrect');
        },
      },
    );
  };

  const handleRetry = (): void => {
    if (value.length > 0) handleComplete(value);
  };

  const handleResend = (): void => {
    if (!canResend || resendOtp.isPending) return;
    resendOtp.mutate(
      { phone: params.phone },
      {
        onSuccess: (response) => {
          setValue('');
          setOutcome('idle');
          setResendDeadline(new Date(Date.now() + response.resend_in_sec * 1000).toISOString());
          setToastVisible(true);
        },
        onError: (error) => {
          if (domainErrorCode(error) === 'OTP_RATE_LIMIT') {
            const sec = retryInSecOf(error);
            setRateLimitTimeKnown(sec !== undefined);
            setRateLimitDeadline(
              new Date(Date.now() + (sec ?? RATE_LIMIT_FALLBACK_SEC) * 1000).toISOString(),
            );
          }
        },
      },
    );
  };

  const otpStatus = toOtpStatus(outcome);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <ScreenHeader title="Verificación" />
      <View
        style={{
          padding: theme.spacing.lg,
          gap: theme.spacing.lg as number,
          alignItems: 'flex-start',
        }}
      >
        <Text style={{ ...theme.typography.body, color: theme.colors.textMuted }}>
          Enviamos un código de 4 dígitos a{' '}
          <Text style={{ fontWeight: '700', color: theme.colors.text }}>
            {maskPhone(params.phone ?? '')}
          </Text>
        </Text>

        <OtpInput
          value={value}
          onChangeValue={setValue}
          onComplete={handleComplete}
          status={otpStatus}
          disabled={outcome === 'verifying' || outcome === 'success'}
          autoFocus
          testID="otp-input"
        />

        {outcome === 'verifying' && (
          <Text style={{ ...theme.typography.small, color: theme.colors.textMuted }}>
            Verificando código…
          </Text>
        )}
        {outcome === 'incorrect' && (
          <Text
            accessibilityRole="alert"
            style={{ ...theme.typography.small, color: theme.colors.danger }}
          >
            Código incorrecto. Inténtalo de nuevo.
          </Text>
        )}
        {outcome === 'expired' && (
          <Text
            accessibilityRole="alert"
            style={{ ...theme.typography.small, color: theme.colors.danger }}
          >
            Este código venció. Solicita uno nuevo.
          </Text>
        )}
        {outcome === 'offline' && (
          <View style={{ gap: theme.spacing.sm as number }}>
            <Text
              accessibilityRole="alert"
              style={{ ...theme.typography.small, color: theme.colors.textMuted }}
            >
              Sin conexión · no pudimos verificar tu código.
            </Text>
            <Button label="Reintentar" variant="ghost" onPress={handleRetry} />
          </View>
        )}

        <ResendArea
          isRateLimited={isRateLimited}
          rateLimitRemaining={rateLimitRemaining}
          rateLimitTimeKnown={rateLimitTimeKnown}
          canResend={canResend}
          resending={resendOtp.isPending}
          resendRemaining={resendRemaining}
          onResend={handleResend}
        />
      </View>

      <Toast
        message="Código reenviado."
        tone="success"
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
      />
    </SafeAreaView>
  );
}

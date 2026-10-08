import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  BrandMark,
  Button,
  Card,
  LinkButton,
  MarkGlyph,
  OtpInput,
  Reveal,
  ScreenHeader,
  Toast,
  formatMMSS,
  useCountdown,
  useTheme,
  type OtpInputStatus,
} from '@voyyaa/ui-mobile';
import type { SessionResponse } from '@voyyaa/shared';
import {
  domainErrorCode,
  isNetworkError,
  retryInSecOf,
  useSessionStore,
} from '@voyyaa/app-runtime';
import { useVerifyOtp } from '../../src/hooks/useVerifyOtp';
import { useRequestOtp } from '../../src/hooks/useRequestOtp';
import { passengerCopy } from '../../src/copy/passenger-copy';

type VerifyOutcome = 'idle' | 'verifying' | 'incorrect' | 'expired' | 'offline' | 'success';

const copy = passengerCopy.auth;

const ANNOUNCE_MESSAGES: Record<VerifyOutcome, string | null> = {
  idle: null,
  verifying: copy.otpVerifyingAnnounce,
  incorrect: copy.otpIncorrect,
  expired: copy.otpExpired,
  offline: copy.otpOfflineAnnounce,
  success: copy.otpSuccess,
};

const RATE_LIMIT_FALLBACK_SEC = 90;
const SUCCESS_HOLD_MS = 700;

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
      <Card tone="tint" testID="rate-limit-card">
        <View
          accessibilityRole="alert"
          style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}
        >
          <MarkGlyph glyph="clock" size={32} />
          <Text style={{ ...theme.typography.small, color: theme.colors.text, flex: 1 }}>
            {rateLimitTimeKnown
              ? copy.otpRateLimited(formatMMSS(rateLimitRemaining))
              : copy.otpRateLimitedUnknown}
          </Text>
        </View>
      </Card>
    );
  }

  if (canResend) {
    return (
      <LinkButton
        label={resending ? copy.otpResending : copy.otpResend}
        disabled={resending}
        onPress={onResend}
        style={{ alignSelf: 'center' }}
        testID="resend-code-button"
      />
    );
  }

  return (
    <Text
      style={{
        ...theme.typography.smallStrong,
        color: theme.colors.textMuted,
        textAlign: 'center',
      }}
    >
      {copy.otpResendIn(resendRemaining)}
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
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!params.phone) router.replace('/(auth)/phone');
  }, [params.phone, router]);

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(copy.otpAnnounce(maskPhone(params.phone ?? '')));
    return () => {
      if (successTimer.current) clearTimeout(successTimer.current);
    };
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
      AccessibilityInfo.announceForAccessibility(copy.otpResendAvailable);
    } else if (!canResend) {
      canResendAnnounced.current = false;
    }
  }, [canResend]);

  useEffect(() => {
    if (outcome !== 'incorrect' && outcome !== 'offline') return;
    setOutcome('idle');
  }, [value]);

  const completeSession = (response: SessionResponse): void => {
    setOutcome('success');
    successTimer.current = setTimeout(() => void setSession(response), SUCCESS_HOLD_MS);
  };

  const handleComplete = (code: string): void => {
    setOutcome('verifying');
    verifyOtp.mutate(
      { phone: params.phone, code },
      {
        onSuccess: completeSession,
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
  const feedbackColor =
    outcome === 'incorrect' || outcome === 'expired'
      ? theme.colors.dangerInk
      : outcome === 'success'
        ? theme.colors.successInk
        : theme.colors.textMuted;
  const feedback: Record<VerifyOutcome, string | null> = {
    idle: null,
    verifying: copy.otpVerifying,
    incorrect: copy.otpIncorrect,
    expired: copy.otpExpired,
    offline: copy.otpOffline,
    success: copy.otpSuccess,
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <ScreenHeader title={copy.otpHeader} onBack={() => router.back()} />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: theme.spacing.xl, gap: theme.spacing.xl }}
      >
        <Reveal>
          <View style={{ alignItems: 'center', gap: theme.spacing.lg }}>
            <BrandMark size={56} tone="onLight" />
            <Text
              style={{
                ...theme.typography.body,
                color: theme.colors.textMuted,
                textAlign: 'center',
              }}
            >
              {copy.otpSentTo}
            </Text>
            <Text
              testID="otp-phone"
              style={{ ...theme.typography.title, color: theme.colors.text, textAlign: 'center' }}
            >
              {maskPhone(params.phone ?? '')}
            </Text>
          </View>
        </Reveal>

        <Reveal index={1}>
          <View style={{ alignItems: 'center', gap: theme.spacing.md }}>
            <OtpInput
              value={value}
              onChangeValue={setValue}
              onComplete={handleComplete}
              status={otpStatus}
              disabled={outcome === 'verifying' || outcome === 'success'}
              autoFocus
              testID="otp-input"
            />
            <View
              style={{
                minHeight: 24,
                flexDirection: 'row',
                alignItems: 'center',
                gap: theme.spacing.sm,
              }}
            >
              {feedback[outcome] !== null && (
                <>
                  {(outcome === 'incorrect' || outcome === 'expired') && (
                    <MarkGlyph glyph="error" size={20} animate={false} />
                  )}
                  {outcome === 'offline' && <MarkGlyph glyph="offline" size={20} animate={false} />}
                  <Text
                    accessibilityRole={outcome === 'verifying' ? undefined : 'alert'}
                    style={{ ...theme.typography.smallStrong, color: feedbackColor }}
                  >
                    {feedback[outcome]}
                  </Text>
                </>
              )}
            </View>
            {outcome === 'offline' && (
              <Button label={copy.otpRetry} variant="ghost" onPress={handleRetry} />
            )}
          </View>
        </Reveal>

        {outcome !== 'verifying' && outcome !== 'success' && (
          <Reveal index={2}>
            <ResendArea
              isRateLimited={isRateLimited}
              rateLimitRemaining={rateLimitRemaining}
              rateLimitTimeKnown={rateLimitTimeKnown}
              canResend={canResend}
              resending={resendOtp.isPending}
              resendRemaining={resendRemaining}
              onResend={handleResend}
            />
          </Reveal>
        )}
      </ScrollView>

      <Toast
        message={copy.otpResent}
        tone="success"
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
      />
    </SafeAreaView>
  );
}

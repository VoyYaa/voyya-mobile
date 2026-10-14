import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Keyboard, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  BrandMark,
  Button,
  LinkButton,
  OtpInput,
  Reveal,
  ScreenHeader,
  Toast,
  useCountdown,
  useTheme,
  type OtpInputHandle,
} from '@voyyaa/ui-mobile';
import { OTP_LENGTH, type SessionResponse } from '@voyyaa/shared';
import { rateLimitWaitSec, useSessionStore } from '@voyyaa/app-runtime';
import { AuthMessage } from '../../src/components/AuthMessage';
import { WaitCard } from '../../src/components/WaitCard';
import { useRequestOtp } from '../../src/hooks/useRequestOtp';
import { useVerifyOtp } from '../../src/hooks/useVerifyOtp';
import { useWaitDeadline, type WaitDeadline } from '../../src/hooks/useWaitDeadline';
import { passengerCopy } from '../../src/copy/passenger-copy';
import { classifyOtpFailure } from '../../src/lib/otp-errors';
import {
  canResendCode,
  sendNoticeView,
  shouldClearOutcome,
  verifyView,
  type SendNoticeKind,
  type VerifyOutcome,
} from '../../src/lib/otp-presentation';

const copy = passengerCopy.auth;

const SUCCESS_HOLD_MS = 700;
const MESSAGE_LINES = 2;
const FALLBACK_LINE_HEIGHT = 19;

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const local = digits.startsWith('57') ? digits.slice(2) : digits;
  return `+57 ${local.slice(0, 3)} ··· ··${local.slice(-2)}`;
}

interface ResendAreaProps {
  wait: WaitDeadline;
  canResend: boolean;
  locked: boolean;
  resending: boolean;
  resendRemaining: number;
  notice: SendNoticeKind | null;
  onResend: () => void;
}

function ResendArea({
  wait,
  canResend,
  locked,
  resending,
  resendRemaining,
  notice,
  onResend,
}: ResendAreaProps): React.JSX.Element {
  const theme = useTheme();

  if (wait.active) {
    return (
      <WaitCard
        title={copy.rateLimitTitleResend}
        remainingSec={wait.remainingSec}
        timeKnown={wait.timeKnown}
      />
    );
  }

  return (
    <View style={{ alignItems: 'center', gap: theme.spacing.sm }}>
      {canResend ? (
        <LinkButton
          label={resending ? copy.otpResending : copy.otpResend}
          disabled={resending || locked}
          onPress={onResend}
          style={{ alignSelf: 'center' }}
          testID="resend-code-button"
        />
      ) : (
        <Text
          accessibilityLabel={copy.otpResendInSpoken(resendRemaining)}
          style={{
            ...theme.typography.smallStrong,
            color: theme.colors.textMuted,
            textAlign: 'center',
          }}
        >
          {copy.otpResendIn(resendRemaining)}
        </Text>
      )}
      {notice !== null && <AuthMessage message={sendNoticeView(notice)} testID="resend-notice" />}
    </View>
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
  const [shaking, setShaking] = useState(false);
  const [resendDeadline, setResendDeadline] = useState<string | null>(params.resendAtIso ?? null);
  const [resendNotice, setResendNotice] = useState<SendNoticeKind | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [focusRequest, setFocusRequest] = useState(0);

  const otpRef = useRef<OtpInputHandle>(null);
  const submittedCode = useRef('');
  const previousOutcome = useRef<VerifyOutcome | null>(null);
  const canResendAnnounced = useRef(false);
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const rateLimit = useWaitDeadline();
  const verifyThrottle = useWaitDeadline();
  const resendThrottle = useWaitDeadline();
  const resendRemaining = useCountdown(resendDeadline);

  const view = verifyView(outcome, shaking);
  const canResend = canResendCode(outcome, rateLimit.active, resendRemaining);
  const messageHeight =
    (theme.typography.smallStrong.lineHeight ?? FALLBACK_LINE_HEIGHT) * MESSAGE_LINES;

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
    if (view.announcement) AccessibilityInfo.announceForAccessibility(view.announcement);
    if (view.closesKeyboard) Keyboard.dismiss();
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
    if (resendNotice !== null) {
      AccessibilityInfo.announceForAccessibility(sendNoticeView(resendNotice).text);
    }
  }, [resendNotice]);

  useEffect(() => {
    if (shouldClearOutcome(outcome, shaking, value, submittedCode.current)) setOutcome('idle');
  }, [value, outcome, shaking]);

  useEffect(() => {
    if (focusRequest > 0) otpRef.current?.focus();
  }, [focusRequest]);

  const completeSession = (response: SessionResponse): void => {
    setOutcome('success');
    successTimer.current = setTimeout(() => void setSession(response), SUCCESS_HOLD_MS);
  };

  const handleVerifyFailure = (error: unknown): void => {
    const failure = classifyOtpFailure(error, 'verify');
    switch (failure.kind) {
      case 'incorrect':
        setShaking(true);
        setOutcome('incorrect');
        return;
      case 'expired':
      case 'max_attempts':
      case 'suspended':
        setValue('');
        setOutcome(failure.kind);
        return;
      case 'throttled':
        verifyThrottle.start(rateLimitWaitSec(error));
        setOutcome('throttled');
        return;
      default:
        setOutcome(failure.kind);
    }
  };

  const handleComplete = (code: string): void => {
    submittedCode.current = code;
    setOutcome('verifying');
    verifyOtp.mutate(
      { phone: params.phone, code },
      { onSuccess: completeSession, onError: handleVerifyFailure },
    );
  };

  const handleBack = (): void => router.back();

  const handleRetry = (): void => {
    if (value.length === OTP_LENGTH) handleComplete(value);
  };

  const handleResendSuccess = (resendInSec: number): void => {
    setValue('');
    setOutcome('idle');
    setShaking(false);
    rateLimit.clear();
    verifyThrottle.clear();
    resendThrottle.clear();
    setResendDeadline(new Date(Date.now() + resendInSec * 1000).toISOString());
    setToastVisible(true);
    setFocusRequest((count) => count + 1);
  };

  const handleResendFailure = (error: unknown): void => {
    const failure = classifyOtpFailure(error, 'request');
    switch (failure.kind) {
      case 'rate_limited':
        rateLimit.start(failure.retryInSec);
        return;
      case 'throttled':
        resendThrottle.start(rateLimitWaitSec(error));
        setResendNotice('throttled');
        return;
      case 'invalid_phone':
        setResendNotice('server');
        return;
      default:
        setResendNotice(failure.kind);
    }
  };

  const handleResend = (): void => {
    if (!canResend || resendOtp.isPending || resendThrottle.active) return;
    setResendNotice(null);
    resendOtp.mutate(
      { phone: params.phone },
      {
        onSuccess: (response) => handleResendSuccess(response.resend_in_sec),
        onError: handleResendFailure,
      },
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <ScreenHeader title={copy.otpHeader} onBack={handleBack} />
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
              ref={otpRef}
              length={OTP_LENGTH}
              value={value}
              onChangeValue={setValue}
              onComplete={handleComplete}
              onErrorSettled={() => setShaking(false)}
              status={view.inputStatus}
              disabled={view.inputDisabled}
              autoFocus
              testID="otp-input"
            />
            <View style={{ minHeight: messageHeight, justifyContent: 'center' }}>
              {view.message !== null && <AuthMessage message={view.message} testID="otp-message" />}
            </View>
            {view.showRetry && (
              <Button
                label={copy.otpRetry}
                variant="ghost"
                onPress={handleRetry}
                disabled={outcome === 'throttled' && verifyThrottle.active}
                testID="retry-verify-button"
              />
            )}
            {view.showBack && (
              <Button
                label={copy.otpSuspendedBack}
                variant="ghost"
                onPress={handleBack}
                testID="back-from-suspended-button"
              />
            )}
          </View>
        </Reveal>

        {outcome !== 'verifying' && outcome !== 'success' && outcome !== 'suspended' && (
          <Reveal index={2}>
            <ResendArea
              wait={rateLimit}
              canResend={canResend}
              locked={resendThrottle.active}
              resending={resendOtp.isPending}
              resendRemaining={resendRemaining}
              notice={resendNotice}
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

import React, { useState } from 'react';
import {
  AccessibilityInfo,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AccentText,
  BrandMark,
  Button,
  Reveal,
  Stage,
  TextField,
  useTheme,
} from '@voyyaa/ui-mobile';
import { rateLimitWaitSec, useNetworkStatus } from '@voyyaa/app-runtime';
import { AuthMessage } from '../../src/components/AuthMessage';
import { WaitCard } from '../../src/components/WaitCard';
import { useRequestOtp } from '../../src/hooks/useRequestOtp';
import { useWaitDeadline } from '../../src/hooks/useWaitDeadline';
import { passengerCopy } from '../../src/copy/passenger-copy';
import { classifyOtpFailure } from '../../src/lib/otp-errors';
import { sendNoticeView, type SendNoticeKind } from '../../src/lib/otp-presentation';

const PHONE_LENGTH = 10;
const BRAND_MARK_SIZE = 56;

export default function PhoneScreen(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const networkStatus = useNetworkStatus();
  const requestOtp = useRequestOtp();
  const copy = passengerCopy.auth;

  const [digits, setDigits] = useState('');
  const [fieldError, setFieldError] = useState<string | undefined>(undefined);
  const [notice, setNotice] = useState<SendNoticeKind | null>(null);

  const wait = useWaitDeadline(() =>
    AccessibilityInfo.announceForAccessibility(copy.sendAvailable),
  );
  const throttle = useWaitDeadline();
  const offline = networkStatus === 'offline';
  const isFormatValid = digits.length === PHONE_LENGTH;
  const visibleNotice: SendNoticeKind | null = wait.active
    ? null
    : offline
      ? 'offline'
      : throttle.active
        ? 'throttled'
        : notice;

  const handleChangeDigits = (raw: string): void => {
    setFieldError(undefined);
    setNotice(null);
    wait.clear();
    setDigits(raw.replace(/[^0-9]/g, '').slice(0, PHONE_LENGTH));
  };

  const handleFailure = (error: unknown): void => {
    const failure = classifyOtpFailure(error, 'request');
    switch (failure.kind) {
      case 'rate_limited':
        wait.start(failure.retryInSec);
        return;
      case 'invalid_phone':
        setFieldError(copy.phoneInvalid);
        return;
      case 'throttled':
        throttle.start(rateLimitWaitSec(error));
        setNotice('throttled');
        return;
      default:
        setNotice(failure.kind);
    }
  };

  const handleSubmit = (): void => {
    if (!isFormatValid || offline || wait.active || throttle.active || requestOtp.isPending) {
      return;
    }
    const phone = `+57${digits}`;
    setFieldError(undefined);
    setNotice(null);
    requestOtp.mutate(
      { phone },
      {
        onSuccess: (response) => {
          const resendAtIso = new Date(Date.now() + response.resend_in_sec * 1000).toISOString();
          router.push({ pathname: '/(auth)/otp', params: { phone, resendAtIso } });
        },
        onError: handleFailure,
      },
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.stage }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stage style={{ flex: 1 }} topInset={insets.top} testID="phone-stage">
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            paddingHorizontal: theme.spacing.gutter,
            paddingBottom: theme.spacing.xl,
            gap: theme.spacing.lg,
          }}
        >
          <Reveal>
            <BrandMark size={BRAND_MARK_SIZE} wordmark />
          </Reveal>
          <Reveal index={1}>
            <AccentText
              accent={copy.heroAccent}
              color={theme.colors.onStage}
              testID="phone-hero-title"
            >
              {copy.heroTitle}
            </AccentText>
          </Reveal>
        </View>
      </Stage>

      <View
        style={{
          flexShrink: 1,
          backgroundColor: theme.colors.bg,
          borderTopLeftRadius: theme.radius.sheet,
          borderTopRightRadius: theme.radius.sheet,
        }}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          bounces={false}
          contentContainerStyle={{
            padding: theme.spacing.xl,
            paddingBottom: theme.spacing.xl + insets.bottom,
            gap: theme.spacing.lg,
          }}
        >
          <View style={{ gap: theme.spacing.sm }}>
            <Text style={{ ...theme.typography.body, color: theme.colors.textMuted }}>
              {copy.phoneIntro}
            </Text>
            <Text
              testID="phone-orientation"
              style={{ ...theme.typography.small, color: theme.colors.textMuted }}
            >
              <Text style={{ ...theme.typography.smallStrong, color: theme.colors.text }}>
                {copy.orientationLead}
              </Text>{' '}
              {copy.orientationBody}
            </Text>
          </View>

          <TextField
            label={copy.phoneLabel}
            value={digits}
            onChangeText={handleChangeDigits}
            placeholder={copy.phonePlaceholder}
            keyboardType="numeric"
            maxLength={PHONE_LENGTH}
            disabled={requestOtp.isPending}
            leadingAdornment={
              <Text style={{ ...theme.typography.bodyStrong, color: theme.colors.textMuted }}>
                +57
              </Text>
            }
            error={fieldError}
            autoComplete="tel"
            textContentType="telephoneNumber"
            returnKeyType="send"
            onSubmitEditing={handleSubmit}
            testID="telefono-input"
          />

          {wait.active ? (
            <WaitCard
              title={copy.rateLimitTitle}
              remainingSec={wait.remainingSec}
              timeKnown={wait.timeKnown}
            />
          ) : (
            <Button
              label={copy.sendCode}
              size="lg"
              onPress={handleSubmit}
              disabled={!isFormatValid || offline || throttle.active}
              loading={requestOtp.isPending}
              loadingLabel={copy.sending}
              accessibilityHint={offline ? copy.offlineSendHint : undefined}
              testID="enviar-codigo-button"
            />
          )}

          {visibleNotice !== null && (
            <AuthMessage message={sendNoticeView(visibleNotice)} alert testID="send-notice" />
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

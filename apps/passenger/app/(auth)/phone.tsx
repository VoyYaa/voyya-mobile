import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AccentText,
  BrandMark,
  Button,
  Card,
  MarkGlyph,
  Reveal,
  Stage,
  TextField,
  formatMMSS,
  useCountdown,
  useTheme,
} from '@voyyaa/ui-mobile';
import { domainErrorCode, retryInSecOf, useNetworkStatus } from '@voyyaa/app-runtime';
import { useRequestOtp } from '../../src/hooks/useRequestOtp';
import { passengerCopy } from '../../src/copy/passenger-copy';

const RATE_LIMIT_FALLBACK_SEC = 90;
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
  const [errorInline, setErrorInline] = useState<string | undefined>(undefined);
  const [rateLimitDeadline, setRateLimitDeadline] = useState<string | null>(null);
  const [rateLimitTimeKnown, setRateLimitTimeKnown] = useState(true);

  const rateLimitRemaining = useCountdown(rateLimitDeadline);
  const isRateLimited = rateLimitDeadline !== null && rateLimitRemaining > 0;
  const isFormatValid = digits.length === PHONE_LENGTH;
  const offline = networkStatus === 'offline';

  const handleChangeDigits = (raw: string): void => {
    setErrorInline(undefined);
    setDigits(raw.replace(/[^0-9]/g, '').slice(0, PHONE_LENGTH));
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
            setRateLimitDeadline(
              new Date(Date.now() + (sec ?? RATE_LIMIT_FALLBACK_SEC) * 1000).toISOString(),
            );
          } else {
            setErrorInline(copy.phoneInvalid);
          }
        },
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
          <Text style={{ ...theme.typography.body, color: theme.colors.textMuted }}>
            {copy.phoneIntro}
          </Text>

          <TextField
            label={copy.phoneLabel}
            value={digits}
            onChangeText={handleChangeDigits}
            placeholder={copy.phonePlaceholder}
            keyboardType="numeric"
            maxLength={PHONE_LENGTH}
            disabled={requestOtp.isPending || isRateLimited}
            leadingAdornment={
              <Text style={{ ...theme.typography.bodyStrong, color: theme.colors.textMuted }}>
                +57
              </Text>
            }
            error={errorInline}
            autoComplete="tel"
            textContentType="telephoneNumber"
            returnKeyType="send"
            onSubmitEditing={handleSubmit}
            testID="telefono-input"
          />

          {isRateLimited ? (
            <Card tone="tint" testID="rate-limit-card">
              <View
                accessibilityRole="alert"
                style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}
              >
                <MarkGlyph glyph="clock" size={40} />
                <View style={{ flex: 1, gap: theme.spacing.xxs }}>
                  <Text style={{ ...theme.typography.bodyStrong, color: theme.colors.text }}>
                    {copy.rateLimitTitle}
                  </Text>
                  <Text style={{ ...theme.typography.small, color: theme.colors.text }}>
                    {rateLimitTimeKnown
                      ? copy.rateLimitWait(formatMMSS(rateLimitRemaining))
                      : copy.rateLimitWaitUnknown}
                  </Text>
                </View>
              </View>
            </Card>
          ) : (
            <Button
              label={copy.sendCode}
              size="lg"
              onPress={handleSubmit}
              disabled={!isFormatValid || offline}
              loading={requestOtp.isPending}
              loadingLabel={copy.sending}
              accessibilityHint={offline ? copy.offlineSendHint : undefined}
              testID="enviar-codigo-button"
            />
          )}

          {offline && !isRateLimited && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
              <MarkGlyph glyph="offline" size={24} animate={false} />
              <Text
                accessibilityRole="alert"
                style={{ ...theme.typography.smallStrong, color: theme.colors.infoInk, flex: 1 }}
              >
                {copy.offlineSend}
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AccentText,
  BrandMark,
  Button,
  LinkButton,
  MarkGlyph,
  Reveal,
  Stage,
  TextField,
  formatMMSS,
  useTheme,
} from '@voyyaa/ui-mobile';
import { DRIVER_PIN_LENGTH, NationalId, Pin } from '@voyyaa/shared';
import {
  domainErrorCode,
  isNetworkError,
  retryInSecOf,
  useNetworkStatus,
  useSessionStore,
} from '@voyyaa/app-runtime';
import { useDriverLogin } from '../../src/hooks/useDriverLogin';
import { useBlockCountdown } from '../../src/hooks/useBlockCountdown';
import { AuthNoticeCard } from '../../src/components/AuthNoticeCard';
import { forgetTemporaryPin, rememberTemporaryPin } from '../../src/auth/remembered-pin';
import { onlyDigits } from '../../src/auth/pin-rules';
import { driverCopy } from '../../src/copy/driver-copy';

type LoginOutcome = 'idle' | 'verifying' | 'credentials' | 'blocked' | 'suspended' | 'offline';

const BRAND_MARK_SIZE = 56;

export default function LoginScreen(): React.JSX.Element {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const networkStatus = useNetworkStatus();
  const login = useDriverLogin();
  const setSession = useSessionStore((s) => s.setSession);

  const [nationalId, setNationalId] = useState('');
  const [pin, setPin] = useState('');
  const [outcome, setOutcome] = useState<LoginOutcome>('idle');
  const [credentialsMessage, setCredentialsMessage] = useState('');
  const [suspendedMessage, setSuspendedMessage] = useState('');
  const block = useBlockCountdown();

  const isBlocked = block.isBlocked;
  const offline = networkStatus === 'offline';
  const isFormatValid = NationalId.safeParse(nationalId).success && Pin.safeParse(pin).success;

  const clearErrorOnEdit = (): void => {
    if (outcome === 'credentials' || outcome === 'offline') setOutcome('idle');
  };

  const handleNationalId = (raw: string): void => {
    clearErrorOnEdit();
    setNationalId(onlyDigits(raw, 15));
  };

  const handlePin = (raw: string): void => {
    clearErrorOnEdit();
    setPin(onlyDigits(raw, DRIVER_PIN_LENGTH));
  };

  const handleLogin = (): void => {
    if (!isFormatValid || offline || login.isPending) return;
    setOutcome('verifying');
    login.mutate(
      { national_id: nationalId, pin },
      {
        onSuccess: (response) => {
          if (response.user.pin_change_required) rememberTemporaryPin(pin);
          else forgetTemporaryPin();
          void setSession(response);
        },
        onError: (error) => {
          if (isNetworkError(error)) {
            setOutcome('offline');
            return;
          }
          const code = domainErrorCode(error);
          if (code === 'ACCOUNT_TEMPORARILY_BLOCKED') {
            block.startBlock(retryInSecOf(error));
            setOutcome('blocked');
          } else if (code === 'ACCOUNT_SUSPENDED') {
            setSuspendedMessage(error.message || driverCopy.login.suspendedFallback);
            setOutcome('suspended');
          } else {
            setCredentialsMessage(error.message || driverCopy.login.credentialsFallback);
            setOutcome('credentials');
          }
        },
      },
    );
  };

  const handleTryAnotherAccount = (): void => {
    setPin('');
    setOutcome('idle');
  };

  const showBlocked = isBlocked;
  const showSuspended = outcome === 'suspended';

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.stage }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stage style={{ flex: 1 }} topInset={insets.top} testID="login-stage">
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            paddingHorizontal: theme.spacing.gutter,
            paddingBottom: theme.spacing.xl,
            gap: theme.spacing.lg,
          }}
        >
          <Reveal index={0}>
            <BrandMark role="driver" size={BRAND_MARK_SIZE} wordmark />
          </Reveal>
          <Reveal index={1}>
            <AccentText accent="conductor" color={theme.colors.onStage} testID="login-title">
              {driverCopy.login.title}
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
            {driverCopy.login.subtitle}
          </Text>

          {showSuspended ? (
            <AuthNoticeCard
              glyph="error"
              title={driverCopy.login.suspendedTitle}
              body={suspendedMessage}
            >
              <LinkButton
                label={driverCopy.login.suspendedBack}
                onPress={handleTryAnotherAccount}
                testID="login-try-another"
              />
            </AuthNoticeCard>
          ) : (
            <>
              <TextField
                label={driverCopy.login.nationalIdLabel}
                value={nationalId}
                onChangeText={handleNationalId}
                placeholder={driverCopy.login.nationalIdPlaceholder}
                keyboardType="numeric"
                maxLength={15}
                disabled={login.isPending || isBlocked}
                testID="cedula-input"
              />
              <TextField
                label={driverCopy.login.pinLabel}
                value={pin}
                onChangeText={handlePin}
                helper={driverCopy.login.pinHelper}
                keyboardType="numeric"
                maxLength={DRIVER_PIN_LENGTH}
                secureTextEntry
                revealable
                disabled={login.isPending || isBlocked}
                error={outcome === 'credentials' ? credentialsMessage : undefined}
                onSubmitEditing={handleLogin}
                testID="pin-input"
              />

              {showBlocked ? (
                <AuthNoticeCard
                  glyph="clock"
                  title={driverCopy.login.blockedTitle}
                  body={
                    block.timeKnown
                      ? driverCopy.login.blockedKnown(formatMMSS(block.remainingSec))
                      : driverCopy.login.blockedUnknown
                  }
                />
              ) : (
                <Button
                  label={driverCopy.login.submit}
                  onPress={handleLogin}
                  size="lg"
                  disabled={!isFormatValid || offline}
                  loading={login.isPending}
                  loadingLabel={driverCopy.login.verifying}
                  accessibilityHint={offline ? driverCopy.login.offlineHint : undefined}
                  testID="iniciar-turno-button"
                />
              )}

              {offline && !showBlocked && (
                <View
                  accessibilityLiveRegion="polite"
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: theme.spacing.sm,
                  }}
                >
                  <MarkGlyph glyph="offline" size={24} animate={false} />
                  <Text
                    style={{
                      ...theme.typography.small,
                      color: theme.colors.infoInk,
                      flex: 1,
                    }}
                  >
                    {driverCopy.login.offline}
                  </Text>
                </View>
              )}
            </>
          )}
          <Text
            style={{
              ...theme.typography.small,
              color: theme.colors.textMuted,
              textAlign: 'center',
            }}
          >
            {driverCopy.login.footer}
          </Text>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

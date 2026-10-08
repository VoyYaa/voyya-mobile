import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AccentText,
  BrandMark,
  Button,
  Card,
  LinkButton,
  MarkGlyph,
  Reveal,
  Stage,
  TextField,
  formatMMSS,
  useCountdown,
  useTheme,
} from '@voyyaa/ui-mobile';
import { NationalId, Pin } from '@voyyaa/shared';
import {
  domainErrorCode,
  isNetworkError,
  retryInSecOf,
  useNetworkStatus,
  useSessionStore,
} from '@voyyaa/app-runtime';
import { useDriverLogin } from '../../src/hooks/useDriverLogin';
import { driverCopy } from '../../src/copy/driver-copy';

type LoginOutcome = 'idle' | 'verifying' | 'credentials' | 'blocked' | 'suspended' | 'offline';

const BLOCKED_FALLBACK_SEC = 90;
const BRAND_MARK_SIZE = 56;
const NOTICE_GLYPH_SIZE = 40;

interface NoticeCardProps {
  glyph: 'clock' | 'error';
  title: string;
  body: string;
  children?: React.ReactNode;
}

function NoticeCard({ glyph, title, body, children }: NoticeCardProps): React.JSX.Element {
  const theme = useTheme();
  return (
    <Card tone="tint" testID="login-notice">
      <View accessibilityRole="alert" style={{ gap: theme.spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
          <MarkGlyph glyph={glyph} size={NOTICE_GLYPH_SIZE} />
          <Text style={{ ...theme.typography.subtitle, color: theme.colors.text, flex: 1 }}>
            {title}
          </Text>
        </View>
        <Text style={{ ...theme.typography.body, color: theme.colors.textMuted }}>{body}</Text>
        {children}
      </View>
    </Card>
  );
}

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
  const [blockedDeadline, setBlockedDeadline] = useState<string | null>(null);
  const [blockedTimeKnown, setBlockedTimeKnown] = useState(true);

  const blockedRemaining = useCountdown(blockedDeadline);
  const isBlocked = outcome === 'blocked' && blockedDeadline !== null && blockedRemaining > 0;
  const offline = networkStatus === 'offline';
  const isFormatValid =
    NationalId.safeParse(nationalId).success && Pin.safeParse(pin).success && pin.length === 4;

  const clearErrorOnEdit = (): void => {
    if (outcome === 'credentials' || outcome === 'offline') setOutcome('idle');
  };

  const handleNationalId = (raw: string): void => {
    clearErrorOnEdit();
    setNationalId(raw.replace(/\D/g, '').slice(0, 15));
  };

  const handlePin = (raw: string): void => {
    clearErrorOnEdit();
    setPin(raw.replace(/\D/g, '').slice(0, 4));
  };

  const handleLogin = (): void => {
    if (!isFormatValid || offline || login.isPending) return;
    setOutcome('verifying');
    login.mutate(
      { national_id: nationalId, pin },
      {
        onSuccess: (response) => {
          void setSession(response);
        },
        onError: (error) => {
          if (isNetworkError(error)) {
            setOutcome('offline');
            return;
          }
          const code = domainErrorCode(error);
          if (code === 'ACCOUNT_TEMPORARILY_BLOCKED') {
            const retrySec = retryInSecOf(error);
            setBlockedTimeKnown(retrySec !== undefined);
            setBlockedDeadline(
              new Date(Date.now() + (retrySec ?? BLOCKED_FALLBACK_SEC) * 1000).toISOString(),
            );
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
    <Stage safeTop topInset={insets.top} style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + theme.spacing.lg }}
        >
          <View
            style={{
              paddingHorizontal: theme.spacing.gutter,
              paddingTop: theme.spacing.xl,
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

          <Reveal index={2} style={{ marginTop: theme.spacing.xl }}>
            <View
              style={{
                backgroundColor: theme.colors.bg,
                borderRadius: theme.radius.sheet,
                marginHorizontal: theme.spacing.sm,
                padding: theme.spacing.lg,
                gap: theme.spacing.lg,
              }}
            >
              <Text style={{ ...theme.typography.body, color: theme.colors.textMuted }}>
                {driverCopy.login.subtitle}
              </Text>

              {showSuspended ? (
                <NoticeCard
                  glyph="error"
                  title={driverCopy.login.suspendedTitle}
                  body={suspendedMessage}
                >
                  <LinkButton
                    label={driverCopy.login.suspendedBack}
                    onPress={handleTryAnotherAccount}
                    testID="login-try-another"
                  />
                </NoticeCard>
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
                    maxLength={4}
                    secureTextEntry
                    revealable
                    disabled={login.isPending || isBlocked}
                    error={outcome === 'credentials' ? credentialsMessage : undefined}
                    onSubmitEditing={handleLogin}
                    testID="pin-input"
                  />

                  {showBlocked ? (
                    <NoticeCard
                      glyph="clock"
                      title={driverCopy.login.blockedTitle}
                      body={
                        blockedTimeKnown
                          ? driverCopy.login.blockedKnown(formatMMSS(blockedRemaining))
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
            </View>
          </Reveal>

          <View
            style={{
              flexGrow: 1,
              justifyContent: 'flex-end',
              padding: theme.spacing.gutter,
              minHeight: 72,
            }}
          >
            <Text
              style={{
                ...theme.typography.small,
                color: theme.colors.onStageMuted,
                textAlign: 'center',
              }}
            >
              {driverCopy.login.footer}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Stage>
  );
}

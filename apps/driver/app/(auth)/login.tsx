import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Chip, TextField, useTheme } from '@voyyaa/ui-mobile';
import { NationalId, Pin } from '@voyyaa/shared';
import { useDriverLogin } from '../../src/hooks/useDriverLogin';
import { useNetworkStatus } from '../../src/hooks/useNetworkStatus';
import { useCountdown } from '../../src/hooks/useCountdown';
import { useSessionStore } from '../../src/state/useSessionStore';
import { domainErrorCode, isNetworkError, retryInSecOf } from '../../src/api/errors';

type LoginOutcome = 'idle' | 'verifying' | 'credentials' | 'blocked' | 'suspended' | 'offline';

function formatMMSS(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const BLOCKED_FALLBACK_SEC = 90;

export default function LoginScreen(): React.JSX.Element {
  const theme = useTheme();
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
            setSuspendedMessage(
              error.message ||
                'Tu empresa suspendió tu acceso. Contacta a tu empresa para más información.',
            );
            setOutcome('suspended');
          } else {
            setCredentialsMessage(error.message || 'Cédula o PIN incorrectos.');
            setOutcome('credentials');
          }
        },
      },
    );
  };

  if (outcome === 'suspended') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
        <Header />
        <View
          accessibilityRole="alert"
          style={{
            flex: 1,
            padding: theme.spacing.xl,
            justifyContent: 'center',
            gap: theme.spacing.sm as number,
          }}
        >
          <Text
            style={{ ...theme.typography.title, color: theme.colors.text, textAlign: 'center' }}
          >
            No puedes ingresar ahora
          </Text>
          <Text
            style={{ ...theme.typography.body, color: theme.colors.textMuted, textAlign: 'center' }}
          >
            {suspendedMessage}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <Header />
      <View style={{ padding: theme.spacing.lg, gap: theme.spacing.lg as number }}>
        <View>
          <Text style={{ ...theme.typography.title, color: theme.colors.text }}>
            Ingreso conductor
          </Text>
          <Text
            style={{
              ...theme.typography.body,
              color: theme.colors.textMuted,
              marginTop: theme.spacing.xs,
            }}
          >
            Tu empresa creó esta cuenta. Ingresa con la cédula y el PIN que te enviaron por SMS.
          </Text>
        </View>

        <TextField
          label="Cédula"
          value={nationalId}
          onChangeText={handleNationalId}
          placeholder="1020304050"
          keyboardType="numeric"
          maxLength={15}
          disabled={login.isPending || isBlocked}
          testID="cedula-input"
        />
        <TextField
          label="PIN"
          value={pin}
          onChangeText={handlePin}
          placeholder="••••"
          keyboardType="numeric"
          maxLength={4}
          secureTextEntry
          revealable
          disabled={login.isPending || isBlocked}
          error={outcome === 'credentials' ? credentialsMessage : undefined}
          testID="pin-input"
        />

        {isBlocked ? (
          <View
            accessibilityRole="alert"
            style={{
              backgroundColor: theme.colors.surfaceAlt,
              borderRadius: theme.radius.card,
              padding: theme.spacing.lg,
              gap: theme.spacing.xs as number,
            }}
          >
            <Text style={{ ...theme.typography.subtitle, color: theme.colors.text }}>
              Demasiados intentos
            </Text>
            <Text style={{ ...theme.typography.body, color: theme.colors.textMuted }}>
              {blockedTimeKnown
                ? `Por seguridad, espera ${formatMMSS(blockedRemaining)} para volver a intentar. `
                : 'Por seguridad, espera unos minutos para volver a intentar. '}
              Si no recuerdas tu PIN, contacta a tu empresa.
            </Text>
          </View>
        ) : (
          <Button
            label="Iniciar turno"
            onPress={handleLogin}
            disabled={!isFormatValid || offline}
            loading={login.isPending}
            loadingLabel="Verificando…"
            accessibilityHint={offline ? 'Sin conexión, no se puede verificar ahora' : undefined}
            testID="iniciar-turno-button"
          />
        )}

        {offline && !isBlocked && (
          <Text style={{ ...theme.typography.small, color: theme.colors.textMuted }}>
            Sin conexión · no se puede verificar ahora.
          </Text>
        )}

        <Card tone="alt">
          <Text style={{ ...theme.typography.small, color: theme.colors.textMuted }}>
            La cuenta la crea tu empresa. Si no la tienes, contáctala directamente.
          </Text>
        </Card>
      </View>
    </SafeAreaView>
  );
}

function Header(): React.JSX.Element {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: theme.spacing.lg,
      }}
    >
      <Text style={{ ...theme.typography.title, color: theme.colors.brandPressed }}>
        VoyYa Conductor
      </Text>
      <Chip label="conductor" tone="neutral" />
    </View>
  );
}

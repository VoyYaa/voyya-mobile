// =============================================================================
// VoyYa Pasajero — Teléfono (P1 del hi-fi aprobado)
// -----------------------------------------------------------------------------
// Primera pantalla del flujo de acceso (HU-AUTH-01). Única responsabilidad:
// capturar y validar el FORMATO del número (10 dígitos) y pedir el envío del
// OTP — nunca navega a Verificación sin que el servidor confirme el envío
// (docs/VoyYa/ux/auth-login-otp.md §3). `hideBack`: esta pantalla es la raíz
// del stack (auth) cuando no hay sesión — el route guard no deja llegar aquí
// con sesión activa, así que no hay una pantalla previa a la que volver.
// =============================================================================

import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, TextField, useTheme } from '@voyya/ui-mobile';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { useSolicitarOtp } from '../../src/hooks/useSolicitarOtp';
import { useNetworkStatus } from '../../src/hooks/useNetworkStatus';
import { useCountdown } from '../../src/hooks/useCountdown';
import { codigoErrorDominio, reintentarEnSegDe } from '../../src/api/errors';

function formatMMSS(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Fallback defensivo SOLO para programar el reintento automático si el
 *  servidor no envía `reintentar_en_seg` (no debería pasar — ErrorAuth lo
 *  documenta como presente en OTP_RATE_LIMIT). El copy en ese caso NO muestra
 *  este número (ver `rateLimitTiempoConocido` abajo): cae al texto sin
 *  cifras exacto de la spec (§3.4.4), aunque el botón sí se re-habilite solo. */
const RATE_LIMIT_FALLBACK_SEG = 90;

export default function TelefonoScreen(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const networkStatus = useNetworkStatus();
  const solicitar = useSolicitarOtp();

  const [digitos, setDigitos] = useState('');
  const [errorInline, setErrorInline] = useState<string | undefined>(undefined);
  const [rateLimitDeadline, setRateLimitDeadline] = useState<string | null>(null);
  const [rateLimitTiempoConocido, setRateLimitTiempoConocido] = useState(true);

  const rateLimitRestante = useCountdown(rateLimitDeadline);
  const enRateLimit = rateLimitDeadline !== null && rateLimitRestante > 0;
  const formatoValido = digitos.length === 10;
  const offline = networkStatus === 'offline';

  const handleChangeDigitos = (raw: string): void => {
    setErrorInline(undefined);
    setDigitos(raw.replace(/[^0-9]/g, '').slice(0, 10));
  };

  const handleEnviar = (): void => {
    if (!formatoValido || offline || solicitar.isPending) return;
    const telefono = `+57${digitos}`;
    solicitar.mutate(
      { telefono },
      {
        onSuccess: (respuesta) => {
          const reenviarEnIso = new Date(Date.now() + respuesta.reenviar_en_seg * 1000).toISOString();
          router.push({ pathname: '/(auth)/otp', params: { telefono, reenviarEnIso } });
        },
        onError: (error) => {
          if (codigoErrorDominio(error) === 'OTP_RATE_LIMIT') {
            const seg = reintentarEnSegDe(error);
            setRateLimitTiempoConocido(seg !== undefined);
            setRateLimitDeadline(new Date(Date.now() + (seg ?? RATE_LIMIT_FALLBACK_SEG) * 1000).toISOString());
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
          value={digitos}
          onChangeText={handleChangeDigitos}
          placeholder="300 123 4567"
          keyboardType="numeric"
          maxLength={10}
          disabled={solicitar.isPending || enRateLimit}
          leadingAdornment={<Text style={{ ...theme.typography.body, color: theme.colors.textMuted }}>+57</Text>}
          error={errorInline}
          autoComplete="tel"
          textContentType="telephoneNumber"
          testID="telefono-input"
        />

        {enRateLimit ? (
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
              {rateLimitTiempoConocido
                ? `Por seguridad, espera ${formatMMSS(rateLimitRestante)} antes de solicitar uno nuevo.`
                : 'Espera unos minutos antes de intentar de nuevo.'}
            </Text>
          </View>
        ) : (
          <Button
            label="Enviar código"
            onPress={handleEnviar}
            disabled={!formatoValido || offline}
            loading={solicitar.isPending}
            loadingLabel="Enviando…"
            accessibilityHint={offline ? 'Sin conexión, no se puede enviar el código ahora' : undefined}
            testID="enviar-codigo-button"
          />
        )}

        {offline && !enRateLimit && (
          <Text style={{ ...theme.typography.small, color: theme.colors.textMuted }}>
            Sin conexión · no se puede enviar el código ahora.
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

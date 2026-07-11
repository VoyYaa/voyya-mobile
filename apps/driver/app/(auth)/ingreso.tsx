// =============================================================================
// VoyYa Conductor — Cédula + PIN (C0 del sketch aprobado)
// -----------------------------------------------------------------------------
// Pantalla RAÍZ de la app Conductor cuando no hay sesión (HU-AUTH-02) — sin
// botón atrás (no hay pantalla previa; ver docs/VoyYa/ux/auth-login-otp.md §5).
// La cuenta la crea la empresa: el conductor nunca se auto-registra aquí.
//
// Validación de formato con los propios validadores del contrato (`Cedula`,
// `Pin` de @voyya/shared) — NO se redefinen reglas en el cliente. Nota: la UX
// spec sugiere "6–10 dígitos" para cédula solo como copy descriptivo; el
// validador real (`Cedula`, 5–15 dígitos) es la fuente de verdad y es lo que
// se aplica aquí, para no bloquear cédulas largas válidas que el backend sí
// acepta. El PIN se limita a 4 dígitos por decisión de producto D-A02 (el
// esquema `Pin` del contrato admite 4–6 en general).
// =============================================================================

import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Chip, TextField, useTheme } from '@voyya/ui-mobile';
import { Cedula, Pin } from '@voyya/shared';
import { useLoginConductor } from '../../src/hooks/useLoginConductor';
import { useNetworkStatus } from '../../src/hooks/useNetworkStatus';
import { useCountdown } from '../../src/hooks/useCountdown';
import { useSessionStore } from '../../src/state/useSessionStore';
import { codigoErrorDominio, esErrorDeRed, reintentarEnSegDe } from '../../src/api/errors';

type LoginOutcome = 'idle' | 'verifying' | 'credenciales' | 'bloqueado' | 'suspendido' | 'offline';

function formatMMSS(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Fallback defensivo SOLO para programar el reintento automático si el
 *  servidor no envía `reintentar_en_seg` con el 429 (no debería pasar — mismo
 *  criterio que apps/passenger/app/(auth)/telefono.tsx). El copy en ese caso
 *  no muestra este número (cae al texto sin cifras, mismo principio §3.4.4). */
const BLOQUEO_FALLBACK_SEG = 90;

export default function IngresoScreen(): React.JSX.Element {
  const theme = useTheme();
  const networkStatus = useNetworkStatus();
  const login = useLoginConductor();
  const setSession = useSessionStore((s) => s.setSession);

  const [cedula, setCedula] = useState('');
  const [pin, setPin] = useState('');
  const [outcome, setOutcome] = useState<LoginOutcome>('idle');
  const [mensajeCredenciales, setMensajeCredenciales] = useState('');
  const [mensajeSuspendido, setMensajeSuspendido] = useState('');
  const [bloqueoDeadline, setBloqueoDeadline] = useState<string | null>(null);
  const [bloqueoTiempoConocido, setBloqueoTiempoConocido] = useState(true);

  const bloqueoRestante = useCountdown(bloqueoDeadline);
  const enBloqueo = outcome === 'bloqueado' && bloqueoDeadline !== null && bloqueoRestante > 0;
  const offline = networkStatus === 'offline';
  const formatoValido = Cedula.safeParse(cedula).success && Pin.safeParse(pin).success && pin.length === 4;

  const limpiarErrorAlEditar = (): void => {
    if (outcome === 'credenciales' || outcome === 'offline') setOutcome('idle');
  };

  const handleCedula = (raw: string): void => {
    limpiarErrorAlEditar();
    setCedula(raw.replace(/\D/g, '').slice(0, 15));
  };

  const handlePin = (raw: string): void => {
    limpiarErrorAlEditar();
    setPin(raw.replace(/\D/g, '').slice(0, 4));
  };

  const handleIngresar = (): void => {
    if (!formatoValido || offline || login.isPending) return;
    setOutcome('verifying');
    login.mutate(
      { cedula, pin },
      {
        onSuccess: (respuesta) => {
          void setSession(respuesta);
          // El route guard (useRouteGuard) redirige a Home al ver status='authenticated'.
        },
        onError: (error) => {
          if (esErrorDeRed(error)) {
            setOutcome('offline');
            return;
          }
          const codigo = codigoErrorDominio(error);
          if (codigo === 'CUENTA_BLOQUEADA_TEMPORAL') {
            const seg = reintentarEnSegDe(error);
            setBloqueoTiempoConocido(seg !== undefined);
            setBloqueoDeadline(new Date(Date.now() + (seg ?? BLOQUEO_FALLBACK_SEG) * 1000).toISOString());
            setOutcome('bloqueado');
          } else if (codigo === 'CUENTA_SUSPENDIDA') {
            // Copy final (nombre de empresa / motivo suspendido vs. documentos
            // vencidos) la produce el backend en `mensaje` — el contrato de
            // @voyya/shared une ambos casos bajo un solo código (ver auth.ts);
            // el cliente no puede distinguirlos de forma confiable, así que
            // muestra tal cual el texto del servidor (nunca lo inventa).
            setMensajeSuspendido(
              error.message || 'Tu empresa suspendió tu acceso. Contacta a tu empresa para más información.',
            );
            setOutcome('suspendido');
          } else {
            setMensajeCredenciales(error.message || 'Cédula o PIN incorrectos.');
            setOutcome('credenciales');
          }
        },
      },
    );
  };

  if (outcome === 'suspendido') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
        <Cabecera />
        <View
          accessibilityRole="alert"
          style={{ flex: 1, padding: theme.spacing.xl, justifyContent: 'center', gap: theme.spacing.sm as number }}
        >
          <Text style={{ ...theme.typography.title, color: theme.colors.text, textAlign: 'center' }}>
            No puedes ingresar ahora
          </Text>
          <Text style={{ ...theme.typography.body, color: theme.colors.textMuted, textAlign: 'center' }}>
            {mensajeSuspendido}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <Cabecera />
      <View style={{ padding: theme.spacing.lg, gap: theme.spacing.lg as number }}>
        <View>
          <Text style={{ ...theme.typography.title, color: theme.colors.text }}>Ingreso conductor</Text>
          <Text style={{ ...theme.typography.body, color: theme.colors.textMuted, marginTop: theme.spacing.xs }}>
            Tu empresa creó esta cuenta. Ingresa con la cédula y el PIN que te enviaron por SMS.
          </Text>
        </View>

        <TextField
          label="Cédula"
          value={cedula}
          onChangeText={handleCedula}
          placeholder="1020304050"
          keyboardType="numeric"
          maxLength={15}
          disabled={login.isPending || enBloqueo}
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
          disabled={login.isPending || enBloqueo}
          error={outcome === 'credenciales' ? mensajeCredenciales : undefined}
          testID="pin-input"
        />

        {enBloqueo ? (
          <View
            accessibilityRole="alert"
            style={{
              backgroundColor: theme.colors.surfaceAlt,
              borderRadius: theme.radius.card,
              padding: theme.spacing.lg,
              gap: theme.spacing.xs as number,
            }}
          >
            <Text style={{ ...theme.typography.subtitle, color: theme.colors.text }}>Demasiados intentos</Text>
            <Text style={{ ...theme.typography.body, color: theme.colors.textMuted }}>
              {bloqueoTiempoConocido
                ? `Por seguridad, espera ${formatMMSS(bloqueoRestante)} para volver a intentar. `
                : 'Por seguridad, espera unos minutos para volver a intentar. '}
              Si no recuerdas tu PIN, contacta a tu empresa.
            </Text>
          </View>
        ) : (
          <Button
            label="Iniciar turno"
            onPress={handleIngresar}
            disabled={!formatoValido || offline}
            loading={login.isPending}
            loadingLabel="Verificando…"
            accessibilityHint={offline ? 'Sin conexión, no se puede verificar ahora' : undefined}
            testID="iniciar-turno-button"
          />
        )}

        {offline && !enBloqueo && (
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

function Cabecera(): React.JSX.Element {
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
      <Text style={{ ...theme.typography.title, color: theme.colors.brandPressed }}>VoyYa Conductor</Text>
      <Chip label="conductor" tone="neutral" />
    </View>
  );
}

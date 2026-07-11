// =============================================================================
// VoyYa Pasajero — Verificación OTP (P2 del hi-fi aprobado)
// -----------------------------------------------------------------------------
// Segunda pantalla del flujo de acceso (HU-AUTH-01) — solo se llega aquí tras
// un envío de OTP confirmado por el servidor (params `telefono`/`reenviarEnIso`
// vienen de (auth)/telefono.tsx). Máquina de estados de
// docs/VoyYa/ux/auth-login-otp.md §4.4. `aria-live` sin spam vía un `useRef`
// con el último estado anunciado — mismo patrón que OfflineBanner.tsx/
// CountdownRing.tsx (§4.5, pedido explícito de la spec).
// =============================================================================

import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, OtpInput, Toast, useTheme, type OtpInputStatus } from '@voyya/ui-mobile';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { useVerificarOtp } from '../../src/hooks/useVerificarOtp';
import { useSolicitarOtp } from '../../src/hooks/useSolicitarOtp';
import { useCountdown } from '../../src/hooks/useCountdown';
import { useSessionStore } from '../../src/state/useSessionStore';
import { codigoErrorDominio, esErrorDeRed, reintentarEnSegDe } from '../../src/api/errors';

type VerifyOutcome = 'idle' | 'verifying' | 'incorrect' | 'expired' | 'offline' | 'success';

const MENSAJES_ANUNCIO: Record<VerifyOutcome, string | null> = {
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

/** Fallback defensivo SOLO para programar el reintento automático si el
 *  servidor no envía `reintentar_en_seg` con el 429 (no debería pasar — mismo
 *  criterio que (auth)/telefono.tsx). El copy en ese caso no muestra este
 *  número (cae al texto sin cifras de la spec, §3.4.4). */
const RATE_LIMIT_FALLBACK_SEG = 90;

/** "+57 300 ··· ··67" — primeros 3 y últimos 2 dígitos, resto enmascarado (§4.2). */
function enmascarar(telefono: string): string {
  const digitos = telefono.replace(/\D/g, '');
  const local = digitos.startsWith('57') ? digitos.slice(2) : digitos;
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

interface ReenvioAreaProps {
  enRateLimit: boolean;
  rateLimitRestante: number;
  rateLimitTiempoConocido: boolean;
  puedeReenviar: boolean;
  reenviando: boolean;
  reenviarRestante: number;
  onReenviar: () => void;
}

/** Extraído del render principal para no anidar 3 estados (rate-limit / disponible /
 *  contando) en un solo ternario JSX — cada rama es un `if` plano, más fácil de leer. */
function ReenvioArea({
  enRateLimit,
  rateLimitRestante,
  rateLimitTiempoConocido,
  puedeReenviar,
  reenviando,
  reenviarRestante,
  onReenviar,
}: ReenvioAreaProps): React.JSX.Element {
  const theme = useTheme();

  if (enRateLimit) {
    return (
      <View
        accessibilityRole="alert"
        style={{ backgroundColor: theme.colors.surfaceAlt, borderRadius: theme.radius.card, padding: theme.spacing.lg }}
      >
        <Text style={{ ...theme.typography.small, color: theme.colors.text }}>
          {rateLimitTiempoConocido
            ? `Ya pediste varios códigos · espera ${formatMMSS(rateLimitRestante)} antes de pedir otro.`
            : 'Ya pediste varios códigos · espera unos minutos antes de pedir otro.'}
        </Text>
      </View>
    );
  }

  if (puedeReenviar) {
    // RN no admite `hitSlop` directo en <Text> (solo en Pressable/Touchable): se
    // envuelve para llegar a las ≥44px de área táctil pedidas por la spec pese a
    // que el texto en sí sea compacto (mismo patrón que "Reintentar ahora" en
    // OfflineBanner.tsx).
    return (
      <Pressable accessibilityRole="link" hitSlop={12} onPress={onReenviar}>
        <Text style={{ ...theme.typography.small, fontWeight: '700', color: theme.colors.brandPressed }}>
          {reenviando ? 'Reenviando…' : 'Reenviar código'}
        </Text>
      </Pressable>
    );
  }

  return (
    <Text style={{ ...theme.typography.small, fontWeight: '700', color: theme.colors.textMuted }}>
      Reenviar código en {reenviarRestante} s
    </Text>
  );
}

export default function OtpScreen(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ telefono: string; reenviarEnIso: string }>();
  const setSession = useSessionStore((s) => s.setSession);

  const verificar = useVerificarOtp();
  const reenviar = useSolicitarOtp();

  const [value, setValue] = useState('');
  const [outcome, setOutcome] = useState<VerifyOutcome>('idle');
  const [reenviarDeadline, setReenviarDeadline] = useState<string | null>(params.reenviarEnIso ?? null);
  const [rateLimitDeadline, setRateLimitDeadline] = useState<string | null>(null);
  const [rateLimitTiempoConocido, setRateLimitTiempoConocido] = useState(true);
  const [toastVisible, setToastVisible] = useState(false);

  const reenviarRestante = useCountdown(reenviarDeadline);
  const rateLimitRestante = useCountdown(rateLimitDeadline);
  const enRateLimit = rateLimitDeadline !== null && rateLimitRestante > 0;
  const puedeReenviar = !enRateLimit && (outcome === 'expired' || reenviarRestante <= 0);

  const previousOutcome = useRef<VerifyOutcome | null>(null);
  const canResendAnnounced = useRef(false);

  // Vuelve a la pantalla de teléfono si llegan sin los params esperados (deep
  // link directo/stale) — nada que verificar sin un número.
  useEffect(() => {
    if (!params.telefono) router.replace('/(auth)/telefono');
  }, [params.telefono, router]);

  // Anuncio de montaje — una sola vez (§4.5).
  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(
      `Código enviado a ${enmascarar(params.telefono ?? '')}. Ingresa los 4 dígitos.`,
    );
    // Deliberadamente solo al montar (mismo criterio que otros efectos "una
    // vez" del repo, p.ej. app/destino.tsx) — no debe repetirse en cada render.
  }, []);

  // Anuncio por transición de estado — una sola vez por transición, nunca por
  // dígito/segundo (mismo patrón `previousState.current` que OfflineBanner.tsx).
  useEffect(() => {
    if (previousOutcome.current === outcome) return;
    previousOutcome.current = outcome;
    const mensaje = MENSAJES_ANUNCIO[outcome];
    if (mensaje) AccessibilityInfo.announceForAccessibility(mensaje);
  }, [outcome]);

  // "Ya puedes reenviar el código." — una sola vez al cruzar a "disponible"
  // (mismo patrón `warnAnnounced` que CountdownRing.tsx).
  useEffect(() => {
    if (puedeReenviar && !canResendAnnounced.current) {
      canResendAnnounced.current = true;
      AccessibilityInfo.announceForAccessibility('Ya puedes reenviar el código.');
    } else if (!puedeReenviar) {
      canResendAnnounced.current = false;
    }
  }, [puedeReenviar]);

  // El usuario retoma el campo tras "incorrecto"/"sin conexión" — vuelve a
  // "idle" apenas cambia el valor (tecleo manual, o el auto-clear interno de
  // OtpInput tras `error`), sin exigir una acción aparte. "expired" queda
  // fuera a propósito: solo se limpia al reenviar (handleReenviar) o al
  // completar 4 dígitos nuevos (handleComplete) — si se resetera con
  // cualquier tecleo, un solo dígito tocado por error apagaría la gracia de
  // "reenviar ya disponible sin esperar 30s" que exige la spec (§4.4.4).
  useEffect(() => {
    if (outcome !== 'incorrect' && outcome !== 'offline') return;
    setOutcome('idle');
    // Deliberadamente solo depende de `value`: agregar `outcome` reintroduciría
    // el reset en el mismo tick en que se acaba de fijar (ver comentario arriba).
  }, [value]);

  const handleComplete = (codigo: string): void => {
    setOutcome('verifying');
    verificar.mutate(
      { telefono: params.telefono, codigo },
      {
        onSuccess: (respuesta) => {
          void setSession(respuesta).then(() => {
            setOutcome('success');
            setTimeout(() => router.replace('/'), 500);
          });
        },
        onError: (error) => {
          if (esErrorDeRed(error)) {
            setOutcome('offline');
            return;
          }
          setOutcome(codigoErrorDominio(error) === 'OTP_EXPIRADO' ? 'expired' : 'incorrect');
        },
      },
    );
  };

  const handleReintentar = (): void => {
    if (value.length > 0) handleComplete(value);
  };

  const handleReenviar = (): void => {
    if (!puedeReenviar || reenviar.isPending) return;
    reenviar.mutate(
      { telefono: params.telefono },
      {
        onSuccess: (respuesta) => {
          setValue('');
          setOutcome('idle');
          setReenviarDeadline(new Date(Date.now() + respuesta.reenviar_en_seg * 1000).toISOString());
          setToastVisible(true);
        },
        onError: (error) => {
          if (codigoErrorDominio(error) === 'OTP_RATE_LIMIT') {
            const seg = reintentarEnSegDe(error);
            setRateLimitTiempoConocido(seg !== undefined);
            setRateLimitDeadline(new Date(Date.now() + (seg ?? RATE_LIMIT_FALLBACK_SEG) * 1000).toISOString());
          }
        },
      },
    );
  };

  const otpStatus = toOtpStatus(outcome);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <ScreenHeader title="Verificación" />
      <View style={{ padding: theme.spacing.lg, gap: theme.spacing.lg as number, alignItems: 'flex-start' }}>
        <Text style={{ ...theme.typography.body, color: theme.colors.textMuted }}>
          Enviamos un código de 4 dígitos a{' '}
          <Text style={{ fontWeight: '700', color: theme.colors.text }}>{enmascarar(params.telefono ?? '')}</Text>
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
          <Text style={{ ...theme.typography.small, color: theme.colors.textMuted }}>Verificando código…</Text>
        )}
        {outcome === 'incorrect' && (
          <Text accessibilityRole="alert" style={{ ...theme.typography.small, color: theme.colors.danger }}>
            Código incorrecto. Inténtalo de nuevo.
          </Text>
        )}
        {outcome === 'expired' && (
          <Text accessibilityRole="alert" style={{ ...theme.typography.small, color: theme.colors.danger }}>
            Este código venció. Solicita uno nuevo.
          </Text>
        )}
        {outcome === 'offline' && (
          <View style={{ gap: theme.spacing.sm as number }}>
            <Text accessibilityRole="alert" style={{ ...theme.typography.small, color: theme.colors.textMuted }}>
              Sin conexión · no pudimos verificar tu código.
            </Text>
            <Button label="Reintentar" variant="ghost" onPress={handleReintentar} />
          </View>
        )}

        <ReenvioArea
          enRateLimit={enRateLimit}
          rateLimitRestante={rateLimitRestante}
          rateLimitTiempoConocido={rateLimitTiempoConocido}
          puedeReenviar={puedeReenviar}
          reenviando={reenviar.isPending}
          reenviarRestante={reenviarRestante}
          onReenviar={handleReenviar}
        />
      </View>

      <Toast message="Código reenviado." tone="success" visible={toastVisible} onHide={() => setToastVisible(false)} />
    </SafeAreaView>
  );
}

// =============================================================================
// VoyYa Conductor — Detalle de solicitud + countdown 15 s
// -----------------------------------------------------------------------------
// §3 de conductor-solicitud-asignacion.md. Máquina de estados de UI (§3.4):
//
//   contando ─(Aceptar)─▶ aceptando ─(200)──────▶ aceptado ──▶ navega
//      │                       ├─(409 ya_tomada)─▶ tomada_por_otro ─▶ lista
//      │                       ├─(sin red/timeout)▶ sin_conexion_respuesta
//      │                       └─(5xx)────────────▶ error_generico
//      ├─(Rechazar)──────────────────────────────▶ rechazado ─▶ lista
//      └─(seg=0, sin tap)────────────────────────▶ expirado ─▶ lista
//
// NO OPTIMISTA (regla explícita de esta tarea/§3.4.2): no hay estado de éxito
// antes de que el servidor confirme la toma única. El countdown es AUTORITATIVO
// DEL SERVIDOR (useCountdown deriva de `expira_en`, nunca de "15 al montar").
// =============================================================================

import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, BackHandler, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Button,
  CountdownRing,
  type CountdownRingStatus,
  ErrorState,
  Map,
  Toast,
  type ToastTone,
  useReducedMotion,
  useTheme,
} from '@voyya/ui-mobile';
import type { NotificacionAsignacion } from '@voyya/shared';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { PassengerSummaryRow } from '../../src/components/PassengerSummaryRow';
import { PointRow } from '../../src/components/PointRow';
import { ActionButtonPair } from '../../src/components/ActionButtonPair';
import { useAceptarAsignacion } from '../../src/hooks/useAceptarAsignacion';
import { useRechazarAsignacion } from '../../src/hooks/useRechazarAsignacion';
import { useCountdown } from '../../src/hooks/useCountdown';
import { SOLICITUDES_CERCANAS_QUERY_KEY } from '../../src/hooks/useSolicitudesCercanas';
import { esErrorDeRed } from '../../src/api/errors';
import { COUNTDOWN_WARN_THRESHOLD_SEG } from '../../src/constants/parametros';

type UiStatus =
  | 'contando'
  | 'aceptando'
  | 'rechazando'
  | 'aceptado'
  | 'rechazado'
  | 'expirado'
  | 'tomada_por_otro'
  | 'sin_conexion_respuesta'
  | 'error_generico';

// Estados que ya no admiten decisión (Aceptar/Rechazar deshabilitados — §3.4.5:
// "evita un tap tardío que dispare una acción sobre una solicitud ya reasignada").
const ESTADOS_SIN_DECISION: readonly UiStatus[] = [
  'aceptando',
  'rechazando',
  'aceptado',
  'rechazado',
  'expirado',
  'tomada_por_otro',
];

const RING_STATUS_POR_UI: Record<UiStatus, CountdownRingStatus> = {
  contando: 'counting',
  aceptando: 'frozen',
  rechazando: 'frozen',
  aceptado: 'success',
  rechazado: 'frozen',
  expirado: 'expired',
  tomada_por_otro: 'frozen',
  sin_conexion_respuesta: 'frozen',
  error_generico: 'frozen',
};

export default function SolicitudDetalleScreen(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const params = useLocalSearchParams<{ id: string }>();
  const idAsignacion = params.id ? Number(params.id) : null;
  const queryClient = useQueryClient();

  // Snapshot de la lista ya cargada (master-detail sin re-fetch): NO reactivo a
  // refetch en segundo plano — aceptable en este ciclo porque los campos de
  // `NotificacionAsignacion` son fijos desde que se creó la notificación (el
  // countdown/estado real de esta pantalla lo gobiernan sus propias mutaciones,
  // no la lista). Ver GAP de `GET /assignments/:id` en assignment.api.ts.
  const notificacion: NotificacionAsignacion | null = idAsignacion
    ? ((
        queryClient.getQueryData<NotificacionAsignacion[]>(SOLICITUDES_CERCANAS_QUERY_KEY) ?? []
      ).find((n) => n.id_asignacion === idAsignacion) ?? null)
    : null;

  const [uiStatus, setUiStatus] = useState<UiStatus>('contando');
  const [ultimaAccion, setUltimaAccion] = useState<'aceptar' | 'rechazar' | null>(null);
  const anunciadoMontaje = useRef(false);

  const aceptar = useAceptarAsignacion(idAsignacion);
  const rechazar = useRechazarAsignacion(idAsignacion);

  const frozen = uiStatus !== 'contando';
  const remainingSec = useCountdown(notificacion?.expira_en ?? null, frozen);

  // Anuncio ÚNICO al montar (§3.6): "Nueva solicitud, quedan N segundos."
  useEffect(() => {
    if (notificacion && !anunciadoMontaje.current) {
      anunciadoMontaje.current = true;
      AccessibilityInfo.announceForAccessibility(
        `Nueva solicitud, quedan ${remainingSec} segundos.`,
      );
    }
    // Solo al identificar la solicitud — no en cada tick de remainingSec.
  }, [notificacion?.id_asignacion]);

  function volverALista(delayMs: number): void {
    setTimeout(() => router.replace('/solicitudes'), delayMs);
  }

  function manejarAceptar(): void {
    setUltimaAccion('aceptar');
    setUiStatus('aceptando');
    aceptar.mutate(undefined, {
      onSuccess: (resultado) => {
        if (resultado.resultado === 'aceptada') {
          setUiStatus('aceptado');
          // C4 (navegación al pasajero) está fuera de alcance de esta spec —
          // placeholder: vuelve a Home tras mostrar el éxito (§3.4.3, 600–900 ms).
          setTimeout(() => router.replace('/'), 800);
        } else if (resultado.resultado === 'ya_tomada') {
          setUiStatus('tomada_por_otro');
          volverALista(1200);
        } else {
          setUiStatus('expirado');
          volverALista(900);
        }
      },
      onError: (error) => {
        setUiStatus(esErrorDeRed(error) ? 'sin_conexion_respuesta' : 'error_generico');
      },
    });
  }

  function manejarRechazar(): void {
    setUltimaAccion('rechazar');
    setUiStatus('rechazando');
    rechazar.mutate(undefined, {
      onSuccess: () => {
        setUiStatus('rechazado');
        volverALista(900);
      },
      onError: (error) => {
        setUiStatus(esErrorDeRed(error) ? 'sin_conexion_respuesta' : 'error_generico');
      },
    });
  }

  function manejarExpiracionLocal(): void {
    // Solo si nadie ya tomó una decisión (evita pisar `aceptando`/`rechazando`
    // con un `onExpire` tardío disparado por el último tick antes de congelar).
    setUiStatus((actual) => {
      if (actual !== 'contando') return actual;
      volverALista(900);
      return 'expirado';
    });
  }

  function reintentar(): void {
    if (ultimaAccion === 'aceptar') manejarAceptar();
    else if (ultimaAccion === 'rechazar') manejarRechazar();
  }

  // Back de Android durante el countdown = Rechazar (§3.6/§4 DoD) — se
  // intercepta, no se ignora. Deja de interceptarse fuera de `contando`.
  useEffect(() => {
    if (uiStatus !== 'contando') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      manejarRechazar();
      return true;
    });
    return () => sub.remove();
  }, [uiStatus]);

  if (!idAsignacion || !notificacion) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
        <ScreenHeader title="Solicitud" />
        <ErrorState
          title="No encontramos esta solicitud"
          body="Puede que ya haya expirado o que la lista se haya actualizado."
          onRetry={() => router.replace('/solicitudes')}
          retryLabel="Volver a la lista"
        />
      </SafeAreaView>
    );
  }

  const aceptada = aceptar.data?.resultado === 'aceptada' ? aceptar.data : null;
  const toastPorEstado: Partial<
    Record<UiStatus, { mensaje: string; tone: ToastTone; durationMs: number }>
  > = {
    aceptado: {
      mensaje: aceptada ? `¡Aceptada! Vas hacia ${aceptada.pasajero.nombre}.` : '¡Aceptada!',
      tone: 'success',
      durationMs: 800,
    },
    rechazado: {
      mensaje: 'Rechazada · buscando otro conductor.',
      tone: 'neutral',
      durationMs: 900,
    },
    expirado: {
      mensaje: 'Se agotó el tiempo · pasando al siguiente conductor.',
      tone: 'neutral',
      durationMs: 900,
    },
    tomada_por_otro: {
      mensaje: 'Esta solicitud ya fue tomada · sigues en turno, te avisaremos de la próxima.',
      tone: 'neutral',
      durationMs: 1200,
    },
  };
  const toast = toastPorEstado[uiStatus];

  const puedeDecidir = !ESTADOS_SIN_DECISION.includes(uiStatus);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <ScreenHeader title="Nueva solicitud" hideBack={uiStatus === 'contando'} />
      <ScrollView
        contentContainerStyle={{
          padding: theme.spacing.lg,
          gap: theme.spacing.lg,
          alignItems: 'center',
        }}
      >
        <CountdownRing
          durationSec={notificacion.segundos_para_responder}
          remainingSec={remainingSec}
          status={RING_STATUS_POR_UI[uiStatus]}
          warnThresholdSec={COUNTDOWN_WARN_THRESHOLD_SEG}
          reducedMotion={reducedMotion}
          onExpire={manejarExpiracionLocal}
        />

        <View style={{ width: '100%' }}>
          <PassengerSummaryRow price={notificacion.tarifa_total} />
        </View>

        {/* Solo el punto de recogida: `destino_barrio` no trae coordenadas (a
            propósito — no se revela la dirección exacta del destino hasta
            aceptar, ver assignment.ts), así que no hay ni marcador de destino
            ni ruta que dibujar aquí. */}
        <Map
          center={{ lat: notificacion.origen.lat, lng: notificacion.origen.lng }}
          markers={[
            {
              id: 'origen',
              kind: 'origen',
              coord: { lat: notificacion.origen.lat, lng: notificacion.origen.lng },
              label: `Recoger en ${notificacion.origen.direccion}`,
            },
          ]}
          interactive={false}
          height={120}
          style={{ width: '100%' }}
        />
        <Text style={{ ...theme.typography.small, color: theme.colors.textMuted }}>
          Recoger a {notificacion.distancia_al_origen_m} m
        </Text>

        <View style={{ width: '100%', gap: theme.spacing.sm as number }}>
          <PointRow marker="●" label="Recoger en" value={notificacion.origen.direccion} />
          <PointRow
            marker="▼"
            label="Destino"
            value={notificacion.destino_barrio}
            markerColor={theme.colors.brandPressed}
          />
        </View>

        {/* Mensajes inline de error — role="alert" (§3.6): a diferencia de los
            toasts, exigen una decisión del conductor (reintentar). */}
        {(uiStatus === 'sin_conexion_respuesta' || uiStatus === 'error_generico') && (
          <View accessibilityRole="alert" style={{ width: '100%' }}>
            <Text
              style={{ ...theme.typography.body, fontWeight: '700', color: theme.colors.danger }}
            >
              {uiStatus === 'sin_conexion_respuesta'
                ? 'Sin conexión · no pudimos enviar tu respuesta.'
                : 'No pudimos procesar tu respuesta.'}
            </Text>
            <Button
              label="Reintentar"
              onPress={reintentar}
              style={{ marginTop: theme.spacing.sm }}
            />
          </View>
        )}

        <View style={{ width: '100%', marginTop: theme.spacing.md }}>
          <ActionButtonPair
            onAccept={manejarAceptar}
            onReject={manejarRechazar}
            loading={
              uiStatus === 'aceptando' ? 'accept' : uiStatus === 'rechazando' ? 'reject' : null
            }
            disabled={!puedeDecidir}
          />
        </View>
      </ScrollView>

      <Toast
        message={toast?.mensaje ?? ''}
        tone={toast?.tone ?? 'neutral'}
        visible={Boolean(toast)}
        durationMs={toast?.durationMs}
        onHide={() => {}}
      />
    </SafeAreaView>
  );
}

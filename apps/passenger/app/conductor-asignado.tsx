// =============================================================================
// VoyYa Pasajero — Conductor asignado (P7 del hi-fi aprobado)
// -----------------------------------------------------------------------------
// Tarjeta de conductor (placa, ETA en RANGO — ADR-003, nunca countdown falso)
// + botón Llamar + chip de cancelación gratuita (§7.4) + cancelación CON hoja
// de confirmación, distinta dentro/fuera de la ventana de 2 min (§7.2/§7.3).
// =============================================================================

import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { esEstadoSolicitudTerminal } from '@voyya/shared';
import { Button, Chip, ErrorState, Map, Skeleton, Toast, useTheme } from '@voyya/ui-mobile';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { DriverCard } from '../src/components/DriverCard';
import { CancelConfirmSheet } from '../src/components/CancelConfirmSheet';
import { useSolicitudEstado } from '../src/hooks/useSolicitudEstado';
import { useTripSocket } from '../src/hooks/useTripSocket';
import { useCancelarSolicitud } from '../src/hooks/useCancelarSolicitud';
import { useCountdown } from '../src/hooks/useCountdown';
import { useNetworkStatus } from '../src/hooks/useNetworkStatus';
import { useTripDraftStore } from '../src/state/useTripDraftStore';
import { VENTANA_CANCELACION_GRATIS_MIN } from '../src/constants/parametros';

function formatMMSS(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function ConductorAsignadoScreen(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const idSolicitud = params.id ? Number(params.id) : null;
  const networkStatus = useNetworkStatus();

  const { data, isError, refetch } = useSolicitudEstado(idSolicitud);
  useTripSocket(idSolicitud);

  const origen = useTripDraftStore((s) => s.origen);
  const destino = useTripDraftStore((s) => s.destino);
  const asignadaEnLocal = useTripDraftStore((s) => s.asignadaEnLocal);
  const marcarAsignadaLocal = useTripDraftStore((s) => s.marcarAsignadaLocal);
  const resetDraft = useTripDraftStore((s) => s.reset);
  const cancelar = useCancelarSolicitud(idSolicitud);

  const [sheetVisible, setSheetVisible] = useState(false);
  const [toast, setToast] = useState<{ mensaje: string; tone: 'success' | 'neutral' } | null>(null);

  useEffect(() => {
    if (data && (data.estado === 'asignada' || data.estado === 'conductor_en_camino')) {
      marcarAsignadaLocal();
    }
  }, [data, marcarAsignadaLocal]);

  // Aproximación de UI (comentada en detalle en useTripDraftStore/parametros.ts):
  // el contrato no expone un `asignada_en` explícito, así que se usa el primer
  // momento local en que se observó el estado `asignada` como ancla del chip.
  const deadlineIso = asignadaEnLocal
    ? new Date(new Date(asignadaEnLocal).getTime() + VENTANA_CANCELACION_GRATIS_MIN * 60_000).toISOString()
    : null;
  const remainingSec = useCountdown(deadlineIso);
  const dentroDeVentana = deadlineIso !== null && remainingSec > 0;

  if (!idSolicitud) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
        <ErrorState title="No encontramos tu viaje" onRetry={() => router.replace('/')} retryLabel="Volver al inicio" />
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
        <ScreenHeader title="Tu viaje" hideBack />
        <ErrorState title="No pudimos ver el estado de tu viaje" onRetry={() => refetch()} />
      </SafeAreaView>
    );
  }

  const confirmarCancelacion = (): void => {
    cancelar.mutate(undefined, {
      onSuccess: (resultado) => {
        setSheetVisible(false);
        setToast({
          mensaje: resultado.gratuita ? 'Cancelaste sin costo.' : 'Viaje cancelado · quedó registrado.',
          tone: resultado.gratuita ? 'success' : 'neutral',
        });
        resetDraft();
        setTimeout(() => router.replace('/'), 1000);
      },
    });
  };

  const estadoTerminal = data ? esEstadoSolicitudTerminal(data.estado) : false;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <ScreenHeader title="Tu viaje" hideBack />
      <View style={{ flex: 1, padding: theme.spacing.lg, gap: theme.spacing.md }}>
        {estadoTerminal ? (
          <ErrorState
            title="Este viaje ya no está activo"
            body="Vuelve al inicio para pedir uno nuevo."
            onRetry={() => router.replace('/')}
            retryLabel="Volver al inicio"
          />
        ) : data?.estado === 'en_curso' ? (
          // Fuera de alcance de este ciclo (pasajero-estados-borde.md §0): las
          // fases ya en curso (abordo/terminado/cobro) pertenecen al siguiente.
          <Text
            style={{ ...theme.typography.title, color: theme.colors.text, textAlign: 'center', marginTop: theme.spacing.xl }}
          >
            Tu viaje está en curso
          </Text>
        ) : (
          <>
            <View>
              <Text style={{ ...theme.typography.title, color: theme.colors.text }}>Tu conductor va en camino</Text>
              {dentroDeVentana && (
                <View style={{ marginTop: theme.spacing.sm, alignSelf: 'flex-start' }}>
                  <Chip tone="success" label={`Cancelación gratis · ${formatMMSS(remainingSec)}`} />
                </View>
              )}
            </View>

            {/* Solo origen/destino reales — el contrato de asignación no expone
                la posición en vivo del conductor (ADR-003: ETA es un RANGO
                estático, sin tracking GPS), así que no se dibuja un "carro". */}
            {origen && destino && (
              <Map
                center={{ lat: (origen.lat + destino.lat) / 2, lng: (origen.lng + destino.lng) / 2 }}
                markers={[
                  { id: 'origen', kind: 'origen', coord: origen, label: `Origen: ${origen.direccion}` },
                  { id: 'destino', kind: 'destino', coord: destino, label: `Destino: ${destino.direccion}` },
                ]}
                route={{ points: [origen, destino] }}
                interactive={false}
                height={160}
              />
            )}

            {data?.conductor ? (
              <DriverCard conductor={data.conductor} />
            ) : (
              <Skeleton height={96} radius={theme.radius.card} />
            )}

            <View style={{ marginTop: 'auto' }}>
              <Button
                label="Cancelar viaje"
                variant="ghost"
                disabled={networkStatus === 'offline'}
                accessibilityHint={networkStatus === 'offline' ? 'Sin conexión, no se puede cancelar ahora' : undefined}
                onPress={() => setSheetVisible(true)}
              />
            </View>
          </>
        )}
      </View>

      <CancelConfirmSheet
        visible={sheetVisible}
        dentroDeVentana={dentroDeVentana}
        loading={cancelar.isPending}
        onConfirmarCancelar={confirmarCancelacion}
        onSeguirEsperando={() => setSheetVisible(false)}
      />

      <Toast
        message={toast?.mensaje ?? ''}
        tone={toast?.tone ?? 'neutral'}
        visible={toast !== null}
        onHide={() => setToast(null)}
      />
    </SafeAreaView>
  );
}

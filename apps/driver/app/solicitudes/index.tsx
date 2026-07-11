// =============================================================================
// VoyYa Conductor — Lista de solicitudes cercanas
// -----------------------------------------------------------------------------
// §2 de conductor-solicitud-asignacion.md. Cubre las 5 variantes/estados:
// fuera de turno (bloqueante, §2.4.2), cargando (skeleton, §2.4.1), sin conexión
// (lista congelada + banner, §2.4.4), vacío (§2.4.3), error del servidor
// (§2.4.6) y con datos (§2.4.5).
// =============================================================================

import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, FlatList, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Chip, EmptyState, ErrorState, useTheme } from '@voyya/ui-mobile';
import type { NotificacionAsignacion } from '@voyya/shared';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { OffShiftPanel } from '../../src/components/OffShiftPanel';
import { RequestRow } from '../../src/components/RequestRow';
import { RequestListSkeleton } from '../../src/components/RequestListSkeleton';
import { AssignmentRulesCard } from '../../src/components/AssignmentRulesCard';
import { useTurnoStore } from '../../src/state/useTurnoStore';
import { useSolicitudesCercanas } from '../../src/hooks/useSolicitudesCercanas';
import { useNetworkStatus } from '../../src/hooks/useNetworkStatus';
import {
  RADIO_BUSQUEDA_FALLBACK_KM,
  TIMEOUT_ACEPTACION_FALLBACK_SEG,
} from '../../src/constants/parametros';

function ordenarPorCercania(items: readonly NotificacionAsignacion[]): NotificacionAsignacion[] {
  return [...items].sort((a, b) => a.distancia_al_origen_m - b.distancia_al_origen_m);
}

export default function SolicitudesCercanasScreen(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const enTurno = useTurnoStore((s) => s.enTurno);
  const activarTurno = useTurnoStore((s) => s.activarTurno);
  const networkStatus = useNetworkStatus();
  const isOffline = networkStatus === 'offline';

  const solicitudes = useSolicitudesCercanas(enTurno);
  const anunciadoCarga = useRef(false);

  // Anuncio de accesibilidad ÚNICO al entrar en carga (§2.4.1) — no por fotograma del shimmer.
  useEffect(() => {
    if (enTurno && solicitudes.isLoading && !anunciadoCarga.current) {
      anunciadoCarga.current = true;
      AccessibilityInfo.announceForAccessibility('Cargando solicitudes cercanas');
    }
    if (!solicitudes.isLoading) {
      anunciadoCarga.current = false;
    }
  }, [enTurno, solicitudes.isLoading]);

  // "Actualizado hace {n}" mientras está sin conexión (§2.4.4) — solo tickea offline.
  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => {
    if (!isOffline) return;
    const interval = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [isOffline]);
  const segundosDesdeActualizacion = solicitudes.dataUpdatedAt
    ? Math.max(0, Math.round((ahora - solicitudes.dataUpdatedAt) / 1000))
    : null;

  const datosOrdenados = solicitudes.data ? ordenarPorCercania(solicitudes.data) : [];
  const hayDatos = datosOrdenados.length > 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <ScreenHeader
        title="Solicitudes activas"
        right={
          enTurno && hayDatos ? (
            <Chip label={String(datosOrdenados.length)} tone="brand" />
          ) : undefined
        }
      />

      {!enTurno ? (
        <View style={{ flex: 1, padding: theme.spacing.lg }}>
          <OffShiftPanel onActivar={activarTurno} />
        </View>
      ) : (
        <FlatList
          data={datosOrdenados}
          keyExtractor={(item) => String(item.id_asignacion)}
          contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.sm as number }}
          ListHeaderComponent={
            <View style={{ gap: theme.spacing.sm as number, marginBottom: theme.spacing.sm }}>
              <Text style={{ ...theme.typography.body, color: theme.colors.textMuted }}>
                Toca una solicitud para ver el detalle y aceptarla.
              </Text>
              {isOffline && (
                <Text
                  accessibilityLiveRegion="polite"
                  style={{ ...theme.typography.small, color: theme.colors.textMuted }}
                >
                  Sin conexión · reintentando…
                  {segundosDesdeActualizacion !== null
                    ? ` Actualizado hace ${segundosDesdeActualizacion} s.`
                    : ''}
                </Text>
              )}
              {solicitudes.isLoading && <RequestListSkeleton />}
              {solicitudes.isError && (
                <ErrorState
                  title="No pudimos cargar tus solicitudes"
                  onRetry={() => solicitudes.refetch()}
                />
              )}
              {solicitudes.isSuccess && !hayDatos && (
                <EmptyState
                  icon="🕐"
                  title="Sin solicitudes cercanas"
                  body="Te avisaremos apenas llegue una solicitud cerca de ti. Sigues visible para los pasajeros."
                  secondaryAction={{
                    label: 'Revisar mi turno y zona',
                    onPress: () => router.push('/'),
                    variant: 'ghost',
                  }}
                />
              )}
            </View>
          }
          renderItem={({ item, index }) => (
            <View style={{ opacity: isOffline ? 0.6 : 1, marginBottom: theme.spacing.sm }}>
              <RequestRow
                originLabel={item.origen.direccion}
                destinationLabel={item.destino_barrio}
                distanceToPickup={`${item.distancia_al_origen_m} m`}
                price={item.tarifa_total}
                isNearest={index === 0}
                onPress={() =>
                  router.push({
                    pathname: '/solicitudes/[id]',
                    params: { id: String(item.id_asignacion) },
                  })
                }
              />
            </View>
          )}
          ListFooterComponent={
            hayDatos ? (
              <AssignmentRulesCard
                radioKm={RADIO_BUSQUEDA_FALLBACK_KM}
                timeoutSeg={TIMEOUT_ACEPTACION_FALLBACK_SEG}
              />
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

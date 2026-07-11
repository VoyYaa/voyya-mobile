// =============================================================================
// VoyYa Pasajero — Buscando (P6 del hi-fi aprobado)
// -----------------------------------------------------------------------------
// Radar + polling del estado real. Cubre "buscando" (con sub-estado de
// búsqueda prolongada §3.5), "sin conductor disponible" (§4) y cancelación
// antes de asignar sin hoja de confirmación (§3.4/§7.1).
// =============================================================================

import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, EmptyState, ErrorState, Map, PriceTag, Toast, useTheme } from '@voyya/ui-mobile';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { RadarSearch } from '../src/components/RadarSearch';
import { useSolicitudEstado } from '../src/hooks/useSolicitudEstado';
import { useTripSocket } from '../src/hooks/useTripSocket';
import { useCancelarSolicitud } from '../src/hooks/useCancelarSolicitud';
import { useCotizar } from '../src/hooks/useCotizar';
import { useCrearSolicitud } from '../src/hooks/useCrearSolicitud';
import { useNetworkStatus } from '../src/hooks/useNetworkStatus';
import { useTripDraftStore } from '../src/state/useTripDraftStore';
import { UMBRAL_BUSQUEDA_PROLONGADA_SEG } from '../src/constants/parametros';

export default function BuscandoScreen(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const idSolicitud = params.id ? Number(params.id) : null;
  const networkStatus = useNetworkStatus();

  const { data, isError, refetch } = useSolicitudEstado(idSolicitud);
  useTripSocket(idSolicitud);

  const origen = useTripDraftStore((s) => s.origen);
  const destino = useTripDraftStore((s) => s.destino);
  const tipoServicio = useTripDraftStore((s) => s.tipoServicio);
  const idMunicipio = useTripDraftStore((s) => s.idMunicipio);
  const resetDraft = useTripDraftStore((s) => s.reset);

  const cancelar = useCancelarSolicitud(idSolicitud);
  const cotizar = useCotizar();
  const crearSolicitud = useCrearSolicitud();

  const [busquedaProlongada, setBusquedaProlongada] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);

  useEffect(() => {
    setBusquedaProlongada(false);
    const timer = setTimeout(() => setBusquedaProlongada(true), UMBRAL_BUSQUEDA_PROLONGADA_SEG * 1000);
    return () => clearTimeout(timer);
  }, [idSolicitud]);

  useEffect(() => {
    if (data?.ui === 'conductor_asignado' && idSolicitud) {
      router.replace({ pathname: '/conductor-asignado', params: { id: String(idSolicitud) } });
    }
  }, [data?.ui, idSolicitud, router]);

  if (!idSolicitud) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
        <ErrorState title="No encontramos tu solicitud" onRetry={() => router.replace('/')} retryLabel="Volver al inicio" />
      </SafeAreaView>
    );
  }

  const cancelarSinConfirmar = (): void => {
    cancelar.mutate(undefined, {
      onSuccess: () => {
        setToastVisible(true);
        resetDraft();
        setTimeout(() => router.replace('/'), 900);
      },
    });
  };

  const reintentarBusqueda = (): void => {
    if (!origen || !destino) {
      router.replace('/');
      return;
    }
    // `sin_conductor` es TERMINAL en TRANSICIONES_SOLICITUD (@voyya/shared) —
    // sin salidas. "Reintentar" no resucita la solicitud vieja: crea una nueva
    // con el MISMO origen/destino/tipo (el pasajero no repite nada), recotizando
    // primero por si el token anterior ya expiró (pasajero-estados-borde.md §4.2).
    cotizar.mutate(
      { origen, destino, id_municipio: idMunicipio, tipo_servicio: tipoServicio },
      {
        onSuccess: (cotizacionFresca) => {
          crearSolicitud.mutate(
            {
              origen,
              destino,
              id_municipio: idMunicipio,
              tipo_servicio: tipoServicio,
              metodo_pago: 'efectivo',
              cotizacion_token: cotizacionFresca.cotizacion_token,
            },
            {
              onSuccess: (nuevaSolicitud) => {
                router.replace({ pathname: '/buscando', params: { id: String(nuevaSolicitud.id_solicitud) } });
              },
            },
          );
        },
      },
    );
  };

  if (isError) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
        <ScreenHeader title=" " hideBack />
        <ErrorState title="No pudimos ver el estado de tu viaje" onRetry={() => refetch()} />
      </SafeAreaView>
    );
  }

  if (data?.ui === 'sin_conductor') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
        <ScreenHeader title=" " hideBack />
        <EmptyState
          icon="🕐"
          title="No hay taxis disponibles ahora"
          body="Todos los conductores cercanos están ocupados. Intenta de nuevo en unos minutos."
          primaryAction={{ label: 'Reintentar', onPress: reintentarBusqueda }}
          secondaryAction={{
            label: 'Volver al inicio',
            onPress: () => {
              resetDraft();
              router.replace('/');
            },
          }}
        />
      </SafeAreaView>
    );
  }

  // Default (incluye `isLoading` y 'buscando'): el camino más común nada más
  // crear la solicitud. `fuera_de_cobertura`/`sin_conexion` de EstadoUIPasajero
  // no se esperan aquí (se resuelven antes de crear la solicitud, en Home/Destino
  // y en el ConnectivityBanner global) — este es el estado por defecto seguro.
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <ScreenHeader title=" " hideBack />
      <View style={{ flex: 1, alignItems: 'center', padding: theme.spacing.xl, gap: theme.spacing.md }}>
        <Text style={{ ...theme.typography.title, color: theme.colors.text, textAlign: 'center' }}>
          Buscando tu viaje…
        </Text>
        <Text style={{ ...theme.typography.body, color: theme.colors.textMuted, textAlign: 'center' }}>
          Estamos contactando a los conductores cercanos.
        </Text>
        {busquedaProlongada && (
          <Text
            accessibilityLiveRegion="polite"
            style={{ ...theme.typography.body, color: theme.colors.textMuted, textAlign: 'center' }}
          >
            Seguimos buscando el conductor más cercano…
          </Text>
        )}

        <RadarSearch />

        {origen && destino && data && (
          <Card style={{ width: '100%' }}>
            <Text style={{ ...theme.typography.small, color: theme.colors.textMuted }}>Resumen</Text>
            <Map
              center={{ lat: (origen.lat + destino.lat) / 2, lng: (origen.lng + destino.lng) / 2 }}
              markers={[
                { id: 'origen', kind: 'origen', coord: origen, label: `Origen: ${origen.direccion}` },
                { id: 'destino', kind: 'destino', coord: destino, label: `Destino: ${destino.direccion}` },
              ]}
              route={{ points: [origen, destino] }}
              interactive={false}
              height={140}
              style={{ marginTop: theme.spacing.xs }}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: theme.spacing.xs }}>
              <View style={{ flex: 1 }}>
                <Text style={{ ...theme.typography.body, color: theme.colors.text }} numberOfLines={1}>
                  {origen.direccion}
                </Text>
                <Text style={{ ...theme.typography.small, color: theme.colors.textMuted }} numberOfLines={1}>
                  → {destino.direccion}
                </Text>
              </View>
              <PriceTag amountCOP={data.tarifa.total} />
            </View>
          </Card>
        )}

        <View style={{ width: '100%', marginTop: theme.spacing.md }}>
          <Button
            label="Cancelar"
            variant="ghost"
            loading={cancelar.isPending}
            loadingLabel="Cancelando…"
            disabled={networkStatus === 'offline'}
            accessibilityHint={networkStatus === 'offline' ? 'Sin conexión, no se puede cancelar ahora' : undefined}
            onPress={cancelarSinConfirmar}
          />
        </View>
      </View>

      <Toast message="Solicitud cancelada." tone="neutral" visible={toastVisible} onHide={() => setToastVisible(false)} />
    </SafeAreaView>
  );
}

// =============================================================================
// VoyYa Pasajero — Confirmar (P5 del hi-fi aprobado)
// -----------------------------------------------------------------------------
// Tarifa fija + método de pago → crea la solicitud. REGLA DE ORO DEL MVP
// (CLAUDE.md): "1 modalidad (taxi)" — moto/confort/envío y nequi/daviplata/
// tarjeta se muestran (fieles al hi-fi aprobado) pero deshabilitados con
// "próximamente"; solo taxi + efectivo son funcionales en este ciclo.
// =============================================================================

import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, ErrorState, Map, PriceTag, Skeleton, useTheme } from '@voyya/ui-mobile';
import type { MetodoPago, TipoServicio } from '@voyya/shared';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { PointRow } from '../src/components/PointRow';
import { ServiceTypeSelector, type ServiceTypeOption } from '../src/components/ServiceTypeSelector';
import { PaymentMethodList, type PaymentMethodOption } from '../src/components/PaymentMethodList';
import { useCotizar } from '../src/hooks/useCotizar';
import { useCrearSolicitud } from '../src/hooks/useCrearSolicitud';
import { useNetworkStatus } from '../src/hooks/useNetworkStatus';
import { useTripDraftStore } from '../src/state/useTripDraftStore';
import { codigoErrorDominio } from '../src/api/errors';

const SERVICE_OPTIONS: readonly ServiceTypeOption[] = [
  { tipo: 'taxi', label: 'Estándar', icon: '🚗', enabled: true },
  { tipo: 'moto', label: 'Moto', icon: '🛵', enabled: false },
  { tipo: 'confort', label: 'Confort', icon: '🚙', enabled: false },
  { tipo: 'envio', label: 'Envío', icon: '📦', enabled: false },
];

const PAYMENT_OPTIONS: readonly PaymentMethodOption[] = [
  { metodo: 'efectivo', label: 'Efectivo', sublabel: 'Pagas al conductor', enabled: true },
  { metodo: 'nequi', label: 'Nequi', sublabel: 'Próximamente', enabled: false },
  { metodo: 'daviplata', label: 'Daviplata', sublabel: 'Próximamente', enabled: false },
  { metodo: 'tarjeta', label: 'Tarjeta', sublabel: 'Próximamente', enabled: false },
];

export default function ConfirmarScreen(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const networkStatus = useNetworkStatus();

  const origen = useTripDraftStore((s) => s.origen);
  const destino = useTripDraftStore((s) => s.destino);
  const idMunicipio = useTripDraftStore((s) => s.idMunicipio);
  const tipoServicio = useTripDraftStore((s) => s.tipoServicio);
  const cotizacion = useTripDraftStore((s) => s.cotizacion);
  const setTipoServicio = useTripDraftStore((s) => s.setTipoServicio);
  const setCotizacion = useTripDraftStore((s) => s.setCotizacion);

  const [metodoPago, setMetodoPago] = useState<MetodoPago>('efectivo');
  const cotizar = useCotizar();
  const crearSolicitud = useCrearSolicitud();

  // Guarda defensiva: si se entra directo a /confirmar sin pasar por /destino
  // (deep link, recarga), no hay datos de la solicitud — vuelve a Home.
  useEffect(() => {
    if (!origen || !destino || !cotizacion) {
      router.replace('/');
    }
    // Deliberadamente solo al montar (no en cada cambio de origen/destino/router):
    // es una guarda de entrada, no una redirección reactiva.
  }, []);

  if (!origen || !destino || !cotizacion) {
    return <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} />;
  }

  const cambiarTipoServicio = (tipo: TipoServicio): void => {
    if (tipo === tipoServicio) return;
    setTipoServicio(tipo);
    cotizar.mutate(
      { origen, destino, id_municipio: idMunicipio, tipo_servicio: tipo },
      { onSuccess: setCotizacion },
    );
  };

  const solicitar = (): void => {
    crearSolicitud.mutate(
      {
        origen,
        destino,
        id_municipio: idMunicipio,
        tipo_servicio: tipoServicio,
        metodo_pago: metodoPago,
        cotizacion_token: cotizacion.cotizacion_token,
      },
      {
        onSuccess: (solicitud) => {
          router.replace({ pathname: '/buscando', params: { id: String(solicitud.id_solicitud) } });
        },
        onError: (error) => {
          // 410 COTIZACION_EXPIRADA: se recotiza sola con el mismo origen/destino
          // — el pasajero no tiene que reconfirmar nada (mismo criterio que
          // "Reintentar" en sin_conductor, ver app/buscando.tsx).
          if (codigoErrorDominio(error) === 'COTIZACION_EXPIRADA') {
            cotizar.mutate(
              { origen, destino, id_municipio: idMunicipio, tipo_servicio: tipoServicio },
              { onSuccess: setCotizacion },
            );
          }
        },
      },
    );
  };

  const codigoError = codigoErrorDominio(crearSolicitud.error);
  const mostrarErrorGenerico = crearSolicitud.isError && codigoError !== 'COTIZACION_EXPIRADA' && codigoError !== 'SOLICITUD_ACTIVA_EXISTENTE';
  const tarifaVigente = cotizar.data ?? cotizacion;
  const solicitarDeshabilitado = networkStatus === 'offline' || crearSolicitud.isPending || cotizar.isPending;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <ScreenHeader title="Confirmar viaje" />
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.lg }}>
        <View style={{ gap: theme.spacing.sm }}>
          <PointRow marker="●" label="Origen" value={origen.direccion} />
          <PointRow marker="▼" label="Destino" value={destino.direccion} markerColor={theme.colors.brandPressed} />
        </View>

        {/* Vista de solo lectura: origen/destino reales + línea recta
            ilustrativa (no hay Directions API integrada en este build). */}
        <Map
          center={{ lat: (origen.lat + destino.lat) / 2, lng: (origen.lng + destino.lng) / 2 }}
          markers={[
            { id: 'origen', kind: 'origen', coord: origen, label: `Origen: ${origen.direccion}` },
            { id: 'destino', kind: 'destino', coord: destino, label: `Destino: ${destino.direccion}` },
          ]}
          route={{ points: [origen, destino] }}
          interactive={false}
          height={180}
        />

        <View>
          <Text style={{ ...theme.typography.small, color: theme.colors.textMuted, marginBottom: theme.spacing.xs }}>
            TIPO DE SERVICIO
          </Text>
          <ServiceTypeSelector options={SERVICE_OPTIONS} selected={tipoServicio} onSelect={cambiarTipoServicio} />
        </View>

        <Card tone="alt">
          {cotizar.isPending ? (
            <Skeleton height={32} width="60%" />
          ) : (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <Text style={{ ...theme.typography.subtitle, color: theme.colors.text }}>Tarifa</Text>
              <PriceTag amountCOP={tarifaVigente.tarifa.total} size="lg" />
            </View>
          )}
          <Text style={{ ...theme.typography.small, color: theme.colors.textMuted, marginTop: theme.spacing.xs }}>
            Tarifa fija · visible antes de confirmar. Cancelación gratis hasta 2 min después de asignar.
          </Text>
        </Card>

        <View>
          <Text style={{ ...theme.typography.small, color: theme.colors.textMuted, marginBottom: theme.spacing.xs }}>
            MÉTODO DE PAGO
          </Text>
          <PaymentMethodList options={PAYMENT_OPTIONS} selected={metodoPago} onSelect={setMetodoPago} />
        </View>

        {codigoError === 'COTIZACION_EXPIRADA' && (
          <Text style={{ ...theme.typography.small, color: theme.colors.textMuted }}>La tarifa cambió, recotizando…</Text>
        )}
        {codigoError === 'SOLICITUD_ACTIVA_EXISTENTE' && (
          <Text style={{ ...theme.typography.small, color: theme.colors.danger }}>
            Ya tienes un viaje activo. Revisa la pestaña Viajes.
          </Text>
        )}
        {mostrarErrorGenerico && <ErrorState title="No pudimos crear tu solicitud" onRetry={solicitar} />}
        {networkStatus === 'offline' && (
          <Text style={{ ...theme.typography.small, color: theme.colors.textMuted }}>
            Sin conexión · no se puede solicitar el viaje ahora.
          </Text>
        )}

        <Button
          label="Solicitar viaje"
          loading={crearSolicitud.isPending}
          loadingLabel="Solicitando…"
          disabled={solicitarDeshabilitado}
          onPress={solicitar}
          accessibilityHint={networkStatus === 'offline' ? 'Sin conexión, no se puede solicitar ahora' : undefined}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

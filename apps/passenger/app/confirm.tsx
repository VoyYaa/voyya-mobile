import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Button,
  Card,
  ErrorState,
  Map,
  PointRow,
  PriceTag,
  ScreenHeader,
  Skeleton,
  useTheme,
} from '@voyyaa/ui-mobile';
import type { PaymentMethod, ServiceType } from '@voyyaa/shared';
import { domainErrorCode, useNetworkStatus } from '@voyyaa/app-runtime';
import { ServiceTypeSelector, type ServiceTypeOption } from '../src/components/ServiceTypeSelector';
import { PaymentMethodList, type PaymentMethodOption } from '../src/components/PaymentMethodList';
import { useQuoteFare } from '../src/hooks/useQuoteFare';
import { useCreateTripRequest } from '../src/hooks/useCreateTripRequest';
import { useTripDraftStore } from '../src/state/useTripDraftStore';

const SERVICE_OPTIONS: readonly ServiceTypeOption[] = [
  { type: 'taxi', label: 'Estándar', icon: '🚗', enabled: true },
  { type: 'motorcycle', label: 'Moto', icon: '🛵', enabled: false },
  { type: 'comfort', label: 'Confort', icon: '🚙', enabled: false },
  { type: 'delivery', label: 'Envío', icon: '📦', enabled: false },
];

const PAYMENT_OPTIONS: readonly PaymentMethodOption[] = [
  { method: 'cash', label: 'Efectivo', sublabel: 'Pagas al conductor', enabled: true },
  { method: 'nequi', label: 'Nequi', sublabel: 'Próximamente', enabled: false },
  { method: 'daviplata', label: 'Daviplata', sublabel: 'Próximamente', enabled: false },
  { method: 'card', label: 'Tarjeta', sublabel: 'Próximamente', enabled: false },
];

export default function ConfirmScreen(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const networkStatus = useNetworkStatus();

  const origin = useTripDraftStore((s) => s.origin);
  const destination = useTripDraftStore((s) => s.destination);
  const municipalityId = useTripDraftStore((s) => s.municipalityId);
  const serviceType = useTripDraftStore((s) => s.serviceType);
  const quote = useTripDraftStore((s) => s.quote);
  const setServiceType = useTripDraftStore((s) => s.setServiceType);
  const setQuote = useTripDraftStore((s) => s.setQuote);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const quoteFare = useQuoteFare();
  const createTripRequest = useCreateTripRequest();

  useEffect(() => {
    if (!origin || !destination || !quote) {
      router.replace('/');
    }
  }, []);

  if (!origin || !destination || !quote) {
    return <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} />;
  }

  const changeServiceType = (type: ServiceType): void => {
    if (type === serviceType) return;
    setServiceType(type);
    quoteFare.mutate(
      { origin, destination, municipality_id: municipalityId, service_type: type },
      { onSuccess: setQuote },
    );
  };

  const requestTrip = (): void => {
    createTripRequest.mutate(
      {
        origin,
        destination,
        municipality_id: municipalityId,
        service_type: serviceType,
        payment_method: paymentMethod,
        quote_token: quote.quote_token,
      },
      {
        onSuccess: (tripRequest) => {
          router.replace({
            pathname: '/searching',
            params: { id: String(tripRequest.trip_request_id) },
          });
        },
        onError: (error) => {
          if (domainErrorCode(error) === 'QUOTE_EXPIRED') {
            quoteFare.mutate(
              { origin, destination, municipality_id: municipalityId, service_type: serviceType },
              { onSuccess: setQuote },
            );
          }
        },
      },
    );
  };

  const errorCode = domainErrorCode(createTripRequest.error);
  const showGenericError =
    createTripRequest.isError &&
    errorCode !== 'QUOTE_EXPIRED' &&
    errorCode !== 'ACTIVE_TRIP_REQUEST_EXISTS';
  const currentFare = quoteFare.data ?? quote;
  const requestDisabled =
    networkStatus === 'offline' || createTripRequest.isPending || quoteFare.isPending;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <ScreenHeader title="Confirmar viaje" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.lg }}>
        <View style={{ gap: theme.spacing.sm }}>
          <PointRow marker="●" label="Origen" value={origin.address} />
          <PointRow
            marker="▼"
            label="Destino"
            value={destination.address}
            markerColor={theme.colors.brandInk}
          />
        </View>

        <Map
          center={{
            lat: (origin.lat + destination.lat) / 2,
            lng: (origin.lng + destination.lng) / 2,
          }}
          markers={[
            { id: 'origin', kind: 'origin', coord: origin, label: `Origen: ${origin.address}` },
            {
              id: 'destination',
              kind: 'destination',
              coord: destination,
              label: `Destino: ${destination.address}`,
            },
          ]}
          route={{ points: [origin, destination] }}
          interactive={false}
          height={180}
        />

        <View>
          <Text
            style={{
              ...theme.typography.small,
              color: theme.colors.textMuted,
              marginBottom: theme.spacing.xs,
            }}
          >
            TIPO DE SERVICIO
          </Text>
          <ServiceTypeSelector
            options={SERVICE_OPTIONS}
            selected={serviceType}
            onSelect={changeServiceType}
          />
        </View>

        <Card tone="alt">
          {quoteFare.isPending ? (
            <Skeleton height={32} width="60%" />
          ) : (
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'baseline',
              }}
            >
              <Text style={{ ...theme.typography.subtitle, color: theme.colors.text }}>Tarifa</Text>
              <PriceTag amountCOP={currentFare.fare.total} size="lg" />
            </View>
          )}
          <Text
            style={{
              ...theme.typography.small,
              color: theme.colors.textMuted,
              marginTop: theme.spacing.xs,
            }}
          >
            Tarifa fija · visible antes de confirmar. Cancelación gratis hasta 2 min después de
            asignar.
          </Text>
        </Card>

        <View>
          <Text
            style={{
              ...theme.typography.small,
              color: theme.colors.textMuted,
              marginBottom: theme.spacing.xs,
            }}
          >
            MÉTODO DE PAGO
          </Text>
          <PaymentMethodList
            options={PAYMENT_OPTIONS}
            selected={paymentMethod}
            onSelect={setPaymentMethod}
          />
        </View>

        {errorCode === 'QUOTE_EXPIRED' && (
          <Text style={{ ...theme.typography.small, color: theme.colors.textMuted }}>
            La tarifa cambió, recotizando…
          </Text>
        )}
        {errorCode === 'ACTIVE_TRIP_REQUEST_EXISTS' && (
          <Text style={{ ...theme.typography.small, color: theme.colors.dangerInk }}>
            Ya tienes un viaje activo. Revisa la pestaña Viajes.
          </Text>
        )}
        {showGenericError && (
          <ErrorState title="No pudimos crear tu solicitud" onRetry={requestTrip} />
        )}
        {networkStatus === 'offline' && (
          <Text style={{ ...theme.typography.small, color: theme.colors.textMuted }}>
            Sin conexión · no se puede solicitar el viaje ahora.
          </Text>
        )}

        <Button
          label="Solicitar viaje"
          loading={createTripRequest.isPending}
          loadingLabel="Solicitando…"
          disabled={requestDisabled}
          onPress={requestTrip}
          accessibilityHint={
            networkStatus === 'offline' ? 'Sin conexión, no se puede solicitar ahora' : undefined
          }
        />
      </ScrollView>
    </SafeAreaView>
  );
}

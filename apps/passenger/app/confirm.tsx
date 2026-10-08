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
import type { PaymentMethod } from '@voyyaa/shared';
import { domainErrorCode, useNetworkStatus } from '@voyyaa/app-runtime';
import { LocationReferenceField } from '../src/components/LocationReferenceField';
import { useQuoteFare } from '../src/hooks/useQuoteFare';
import { useCreateTripRequest } from '../src/hooks/useCreateTripRequest';
import { useTripDraftStore } from '../src/state/useTripDraftStore';
import { composeAddress } from '../src/lib/address';

const PAYMENT_METHOD: PaymentMethod = 'cash';

export default function ConfirmScreen(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const networkStatus = useNetworkStatus();

  const origin = useTripDraftStore((s) => s.origin);
  const destination = useTripDraftStore((s) => s.destination);
  const municipalityId = useTripDraftStore((s) => s.municipalityId);
  const serviceType = useTripDraftStore((s) => s.serviceType);
  const quote = useTripDraftStore((s) => s.quote);
  const setQuote = useTripDraftStore((s) => s.setQuote);

  const [pickupReference, setPickupReference] = useState('');
  const [dropoffReference, setDropoffReference] = useState('');
  const [dropoffReferenceExpanded, setDropoffReferenceExpanded] = useState(false);
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

  const requestTrip = (): void => {
    createTripRequest.mutate(
      {
        origin: { ...origin, address: composeAddress(origin.address, pickupReference) },
        destination: {
          ...destination,
          address: composeAddress(destination.address, dropoffReference),
        },
        municipality_id: municipalityId,
        service_type: serviceType,
        payment_method: PAYMENT_METHOD,
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

        <LocationReferenceField
          label="¿Alguna referencia para que te encuentren?"
          value={pickupReference}
          onChangeText={setPickupReference}
          accessibilityLabel="Referencia para tu punto de recogida, opcional"
        />

        {dropoffReferenceExpanded ? (
          <LocationReferenceField
            label="Referencia del destino"
            value={dropoffReference}
            onChangeText={setDropoffReference}
            accessibilityLabel="Referencia para tu destino, opcional"
          />
        ) : (
          <Text
            accessibilityRole="link"
            onPress={() => setDropoffReferenceExpanded(true)}
            style={{ ...theme.typography.small, fontWeight: '700', color: theme.colors.brandInk }}
          >
            + Agregar una referencia del destino
          </Text>
        )}

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

        <Card>
          <Text style={{ ...theme.typography.body, color: theme.colors.text }}>
            Servicio: <Text style={{ fontWeight: '700' }}>Taxi</Text>
          </Text>
          <Text
            style={{
              ...theme.typography.body,
              color: theme.colors.text,
              marginTop: theme.spacing.xs,
            }}
          >
            Pago: <Text style={{ fontWeight: '700' }}>Efectivo</Text>
          </Text>
          <Text
            style={{
              ...theme.typography.small,
              color: theme.colors.textMuted,
              marginTop: theme.spacing.xs,
            }}
          >
            Pagas al conductor al terminar el viaje.
          </Text>
        </Card>

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

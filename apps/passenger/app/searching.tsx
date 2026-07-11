import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, EmptyState, ErrorState, Map, PriceTag, Toast, useTheme } from '@voyyaa/ui-mobile';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { RadarSearch } from '../src/components/RadarSearch';
import { useTripRequestStatus } from '../src/hooks/useTripRequestStatus';
import { useTripSocket } from '../src/hooks/useTripSocket';
import { useCancelTripRequest } from '../src/hooks/useCancelTripRequest';
import { useQuoteFare } from '../src/hooks/useQuoteFare';
import { useCreateTripRequest } from '../src/hooks/useCreateTripRequest';
import { useNetworkStatus } from '../src/hooks/useNetworkStatus';
import { useTripDraftStore } from '../src/state/useTripDraftStore';
import { PROLONGED_SEARCH_THRESHOLD_SEC } from '../src/constants/parameters';

export default function SearchingScreen(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const tripRequestId = params.id ? Number(params.id) : null;
  const networkStatus = useNetworkStatus();

  const { data, isError, refetch } = useTripRequestStatus(tripRequestId);
  useTripSocket(tripRequestId);

  const origin = useTripDraftStore((s) => s.origin);
  const destination = useTripDraftStore((s) => s.destination);
  const serviceType = useTripDraftStore((s) => s.serviceType);
  const municipalityId = useTripDraftStore((s) => s.municipalityId);
  const resetDraft = useTripDraftStore((s) => s.reset);

  const cancelTripRequest = useCancelTripRequest(tripRequestId);
  const quoteFare = useQuoteFare();
  const createTripRequest = useCreateTripRequest();

  const [prolongedSearch, setProlongedSearch] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);

  useEffect(() => {
    setProlongedSearch(false);
    const timer = setTimeout(() => setProlongedSearch(true), PROLONGED_SEARCH_THRESHOLD_SEC * 1000);
    return () => clearTimeout(timer);
  }, [tripRequestId]);

  useEffect(() => {
    if (data?.ui === 'driver_assigned' && tripRequestId) {
      router.replace({ pathname: '/driver-assigned', params: { id: String(tripRequestId) } });
    }
  }, [data?.ui, tripRequestId, router]);

  if (!tripRequestId) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
        <ErrorState title="No encontramos tu solicitud" onRetry={() => router.replace('/')} retryLabel="Volver al inicio" />
      </SafeAreaView>
    );
  }

  const cancelWithoutConfirm = (): void => {
    cancelTripRequest.mutate(undefined, {
      onSuccess: () => {
        setToastVisible(true);
        resetDraft();
        setTimeout(() => router.replace('/'), 900);
      },
    });
  };

  const retrySearch = (): void => {
    if (!origin || !destination) {
      router.replace('/');
      return;
    }
    quoteFare.mutate(
      { origin, destination, municipality_id: municipalityId, service_type: serviceType },
      {
        onSuccess: (freshQuote) => {
          createTripRequest.mutate(
            {
              origin,
              destination,
              municipality_id: municipalityId,
              service_type: serviceType,
              payment_method: 'cash',
              quote_token: freshQuote.quote_token,
            },
            {
              onSuccess: (newTripRequest) => {
                router.replace({ pathname: '/searching', params: { id: String(newTripRequest.trip_request_id) } });
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

  if (data?.ui === 'no_driver') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
        <ScreenHeader title=" " hideBack />
        <EmptyState
          icon="🕐"
          title="No hay taxis disponibles ahora"
          body="Todos los conductores cercanos están ocupados. Intenta de nuevo en unos minutos."
          primaryAction={{ label: 'Reintentar', onPress: retrySearch }}
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
        {prolongedSearch && (
          <Text
            accessibilityLiveRegion="polite"
            style={{ ...theme.typography.body, color: theme.colors.textMuted, textAlign: 'center' }}
          >
            Seguimos buscando el conductor más cercano…
          </Text>
        )}

        <RadarSearch />

        {origin && destination && data && (
          <Card style={{ width: '100%' }}>
            <Text style={{ ...theme.typography.small, color: theme.colors.textMuted }}>Resumen</Text>
            <Map
              center={{ lat: (origin.lat + destination.lat) / 2, lng: (origin.lng + destination.lng) / 2 }}
              markers={[
                { id: 'origin', kind: 'origin', coord: origin, label: `Origen: ${origin.address}` },
                { id: 'destination', kind: 'destination', coord: destination, label: `Destino: ${destination.address}` },
              ]}
              route={{ points: [origin, destination] }}
              interactive={false}
              height={140}
              style={{ marginTop: theme.spacing.xs }}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: theme.spacing.xs }}>
              <View style={{ flex: 1 }}>
                <Text style={{ ...theme.typography.body, color: theme.colors.text }} numberOfLines={1}>
                  {origin.address}
                </Text>
                <Text style={{ ...theme.typography.small, color: theme.colors.textMuted }} numberOfLines={1}>
                  → {destination.address}
                </Text>
              </View>
              <PriceTag amountCOP={data.fare.total} />
            </View>
          </Card>
        )}

        <View style={{ width: '100%', marginTop: theme.spacing.md }}>
          <Button
            label="Cancelar"
            variant="ghost"
            loading={cancelTripRequest.isPending}
            loadingLabel="Cancelando…"
            disabled={networkStatus === 'offline'}
            accessibilityHint={networkStatus === 'offline' ? 'Sin conexión, no se puede cancelar ahora' : undefined}
            onPress={cancelWithoutConfirm}
          />
        </View>
      </View>

      <Toast message="Solicitud cancelada." tone="neutral" visible={toastVisible} onHide={() => setToastVisible(false)} />
    </SafeAreaView>
  );
}

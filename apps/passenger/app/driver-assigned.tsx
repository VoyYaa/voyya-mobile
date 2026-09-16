import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Button,
  Chip,
  EmptyState,
  ErrorState,
  LastUpdatedHint,
  Map,
  PriceTag,
  ScreenHeader,
  Skeleton,
  Toast,
  formatCOP,
  formatMMSS,
  useCountdown,
  useTheme,
} from '@voyyaa/ui-mobile';
import { useNetworkStatus } from '@voyyaa/app-runtime';
import { DriverCard } from '../src/components/DriverCard';
import { CancelConfirmSheet } from '../src/components/CancelConfirmSheet';
import { useTripRequestStatus } from '../src/hooks/useTripRequestStatus';
import { useCancelTripRequest } from '../src/hooks/useCancelTripRequest';
import { useTripDraftStore } from '../src/state/useTripDraftStore';
import { FREE_CANCELLATION_WINDOW_MIN } from '../src/constants/parameters';

export default function DriverAssignedScreen(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const tripRequestId = params.id ? Number(params.id) : null;
  const networkStatus = useNetworkStatus();

  const { data, isLoading, isError, dataUpdatedAt, refetch } = useTripRequestStatus(tripRequestId);

  const origin = useTripDraftStore((s) => s.origin);
  const destination = useTripDraftStore((s) => s.destination);
  const assignedAtLocal = useTripDraftStore((s) => s.assignedAtLocal);
  const markAssignedLocal = useTripDraftStore((s) => s.markAssignedLocal);
  const resetDraft = useTripDraftStore((s) => s.reset);
  const cancelTripRequest = useCancelTripRequest(tripRequestId);

  const [sheetVisible, setSheetVisible] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'neutral' } | null>(null);

  useEffect(() => {
    if (data && (data.status === 'assigned' || data.status === 'driver_en_route')) {
      markAssignedLocal();
    }
  }, [data, markAssignedLocal]);

  const deadlineIso = assignedAtLocal
    ? new Date(
        new Date(assignedAtLocal).getTime() + FREE_CANCELLATION_WINDOW_MIN * 60_000,
      ).toISOString()
    : null;
  const remainingSec = useCountdown(deadlineIso);
  const withinWindow = deadlineIso !== null && remainingSec > 0;

  const goHome = (): void => {
    resetDraft();
    router.replace('/');
  };

  if (!tripRequestId) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
        <ErrorState
          title="No encontramos tu viaje"
          onRetry={() => router.replace('/')}
          retryLabel="Volver al inicio"
        />
      </SafeAreaView>
    );
  }

  if (isError && !data) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
        <ScreenHeader title="Tu viaje" />
        <ErrorState title="No pudimos ver el estado de tu viaje" onRetry={() => refetch()} />
      </SafeAreaView>
    );
  }

  if (isLoading || !data) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
        <ScreenHeader title="Tu viaje" />
        <View style={{ padding: theme.spacing.lg, gap: theme.spacing.md }}>
          <Skeleton height={28} width="70%" />
          <Skeleton height={160} radius={theme.radius.card} />
          <Skeleton height={96} radius={theme.radius.card} />
        </View>
      </SafeAreaView>
    );
  }

  const confirmCancellation = (): void => {
    cancelTripRequest.mutate(undefined, {
      onSuccess: (result) => {
        setSheetVisible(false);
        setToast({
          message: result.free_of_charge
            ? 'Cancelaste sin costo.'
            : 'Viaje cancelado · quedó registrado.',
          tone: result.free_of_charge ? 'success' : 'neutral',
        });
        resetDraft();
        setTimeout(() => router.replace('/'), 1000);
      },
    });
  };

  if (data.ui === 'trip_completed') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
        <ScreenHeader title="Tu viaje" />
        <EmptyState
          icon="✅"
          title="¡Viaje completado!"
          body={`Pagaste en efectivo · ${formatCOP(data.fare.total)}`}
          primaryAction={{ label: 'Volver al inicio', onPress: goHome }}
        />
      </SafeAreaView>
    );
  }

  if (data.ui === 'trip_no_show') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
        <ScreenHeader title="Tu viaje" />
        <EmptyState
          title="No pudimos completar tu viaje"
          body="El conductor no te encontró en el punto de encuentro. Puedes solicitar un nuevo viaje cuando quieras."
          primaryAction={{ label: 'Pedir un nuevo viaje', onPress: goHome }}
        />
      </SafeAreaView>
    );
  }

  if (data.ui === 'trip_cancelled') {
    const cancelledByDriver = data.status === 'cancelled_by_driver';
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
        <ScreenHeader title="Tu viaje" />
        <EmptyState
          title={cancelledByDriver ? 'El conductor canceló este viaje' : 'Cancelaste este viaje'}
          body={
            cancelledByDriver
              ? 'Puedes solicitar uno nuevo; te asignaremos otro conductor disponible.'
              : 'Viaje cancelado · quedó registrado.'
          }
          primaryAction={{
            label: cancelledByDriver ? 'Pedir un nuevo viaje' : 'Volver al inicio',
            onPress: goHome,
          }}
        />
      </SafeAreaView>
    );
  }

  const isWaiting = data.ui === 'driver_waiting';
  const isInProgress = data.ui === 'trip_in_progress';
  const title = isInProgress
    ? 'Tu viaje está en curso'
    : isWaiting
      ? 'Tu conductor te está esperando en el punto de encuentro'
      : 'Tu conductor va en camino';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <ScreenHeader title="Tu viaje" />
      <View style={{ flex: 1, padding: theme.spacing.lg, gap: theme.spacing.md }}>
        <View>
          <Text style={{ ...theme.typography.title, color: theme.colors.text }}>{title}</Text>
          <View style={{ marginTop: theme.spacing.xs }}>
            <LastUpdatedHint updatedAtMs={dataUpdatedAt} isStale={isError} />
          </View>
          {!isInProgress && withinWindow && (
            <View style={{ marginTop: theme.spacing.sm, alignSelf: 'flex-start' }}>
              <Chip tone="success" label={`Cancelación gratis · ${formatMMSS(remainingSec)}`} />
            </View>
          )}
        </View>

        {!isInProgress && origin && destination && (
          <Map
            center={{
              lat: (origin.lat + destination.lat) / 2,
              lng: (origin.lng + destination.lng) / 2,
            }}
            markers={[
              {
                id: 'origin',
                kind: 'origin',
                coord: origin,
                label: `Origen: ${origin.address}`,
              },
              {
                id: 'destination',
                kind: 'destination',
                coord: destination,
                label: `Destino: ${destination.address}`,
              },
            ]}
            route={{ points: [origin, destination] }}
            interactive={false}
            height={160}
          />
        )}

        {isInProgress && origin && destination && (
          <View
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{ ...theme.typography.body, color: theme.colors.text }}
                numberOfLines={1}
              >
                {origin.address}
              </Text>
              <Text
                style={{ ...theme.typography.small, color: theme.colors.textMuted }}
                numberOfLines={1}
              >
                → {destination.address}
              </Text>
            </View>
            <PriceTag amountCOP={data.fare.total} />
          </View>
        )}

        {data.driver ? (
          <DriverCard driver={data.driver} />
        ) : (
          <Skeleton height={96} radius={theme.radius.card} />
        )}

        {!isInProgress && (
          <View style={{ marginTop: 'auto' }}>
            <Button
              label="Cancelar viaje"
              variant="ghost"
              disabled={networkStatus === 'offline'}
              accessibilityHint={
                networkStatus === 'offline' ? 'Sin conexión, no se puede cancelar ahora' : undefined
              }
              onPress={() => setSheetVisible(true)}
            />
          </View>
        )}
      </View>

      <CancelConfirmSheet
        visible={sheetVisible}
        withinWindow={withinWindow}
        loading={cancelTripRequest.isPending}
        onConfirmCancel={confirmCancellation}
        onKeepWaiting={() => setSheetVisible(false)}
      />

      <Toast
        message={toast?.message ?? ''}
        tone={toast?.tone ?? 'neutral'}
        visible={toast !== null}
        onHide={() => setToast(null)}
      />
    </SafeAreaView>
  );
}

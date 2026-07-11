import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { isTerminalTripStatus } from '@voyyaa/shared';
import { Button, Chip, ErrorState, Map, Skeleton, Toast, useTheme } from '@voyyaa/ui-mobile';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { DriverCard } from '../src/components/DriverCard';
import { CancelConfirmSheet } from '../src/components/CancelConfirmSheet';
import { useTripRequestStatus } from '../src/hooks/useTripRequestStatus';
import { useTripSocket } from '../src/hooks/useTripSocket';
import { useCancelTripRequest } from '../src/hooks/useCancelTripRequest';
import { useCountdown } from '../src/hooks/useCountdown';
import { useNetworkStatus } from '../src/hooks/useNetworkStatus';
import { useTripDraftStore } from '../src/state/useTripDraftStore';
import { FREE_CANCELLATION_WINDOW_MIN } from '../src/constants/parameters';

function formatMMSS(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function DriverAssignedScreen(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const tripRequestId = params.id ? Number(params.id) : null;
  const networkStatus = useNetworkStatus();

  const { data, isError, refetch } = useTripRequestStatus(tripRequestId);
  useTripSocket(tripRequestId);

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
    ? new Date(new Date(assignedAtLocal).getTime() + FREE_CANCELLATION_WINDOW_MIN * 60_000).toISOString()
    : null;
  const remainingSec = useCountdown(deadlineIso);
  const withinWindow = deadlineIso !== null && remainingSec > 0;

  if (!tripRequestId) {
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

  const confirmCancellation = (): void => {
    cancelTripRequest.mutate(undefined, {
      onSuccess: (result) => {
        setSheetVisible(false);
        setToast({
          message: result.free_of_charge ? 'Cancelaste sin costo.' : 'Viaje cancelado · quedó registrado.',
          tone: result.free_of_charge ? 'success' : 'neutral',
        });
        resetDraft();
        setTimeout(() => router.replace('/'), 1000);
      },
    });
  };

  const isTerminal = data ? isTerminalTripStatus(data.status) : false;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <ScreenHeader title="Tu viaje" hideBack />
      <View style={{ flex: 1, padding: theme.spacing.lg, gap: theme.spacing.md }}>
        {isTerminal ? (
          <ErrorState
            title="Este viaje ya no está activo"
            body="Vuelve al inicio para pedir uno nuevo."
            onRetry={() => router.replace('/')}
            retryLabel="Volver al inicio"
          />
        ) : data?.status === 'in_progress' ? (
          <Text
            style={{ ...theme.typography.title, color: theme.colors.text, textAlign: 'center', marginTop: theme.spacing.xl }}
          >
            Tu viaje está en curso
          </Text>
        ) : (
          <>
            <View>
              <Text style={{ ...theme.typography.title, color: theme.colors.text }}>Tu conductor va en camino</Text>
              {withinWindow && (
                <View style={{ marginTop: theme.spacing.sm, alignSelf: 'flex-start' }}>
                  <Chip tone="success" label={`Cancelación gratis · ${formatMMSS(remainingSec)}`} />
                </View>
              )}
            </View>

            {origin && destination && (
              <Map
                center={{ lat: (origin.lat + destination.lat) / 2, lng: (origin.lng + destination.lng) / 2 }}
                markers={[
                  { id: 'origin', kind: 'origin', coord: origin, label: `Origen: ${origin.address}` },
                  { id: 'destination', kind: 'destination', coord: destination, label: `Destino: ${destination.address}` },
                ]}
                route={{ points: [origin, destination] }}
                interactive={false}
                height={160}
              />
            )}

            {data?.driver ? (
              <DriverCard driver={data.driver} />
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

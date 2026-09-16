import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState, ErrorState, ScreenHeader, Skeleton, useTheme } from '@voyyaa/ui-mobile';
import { useNetworkStatus } from '@voyyaa/app-runtime';
import { CashPendingRow } from '../src/components/CashPendingRow';
import { usePendingCashTrips } from '../src/hooks/usePendingCashTrips';
import { useConfirmCashCollected } from '../src/hooks/useConfirmCashCollected';

export default function CashPendingScreen(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const networkStatus = useNetworkStatus();
  const isOffline = networkStatus === 'offline';

  const pending = usePendingCashTrips();
  const confirm = useConfirmCashCollected();
  const [rowErrors, setRowErrors] = useState<Record<number, string | undefined>>({});

  function handleConfirm(tripRequestId: number): void {
    setRowErrors((current) => ({ ...current, [tripRequestId]: undefined }));
    confirm.mutate(tripRequestId, {
      onError: () =>
        setRowErrors((current) => ({
          ...current,
          [tripRequestId]: 'No pudimos confirmar este cobro.',
        })),
    });
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <ScreenHeader title="Cobros pendientes" onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.sm as number }}
      >
        {isOffline && (
          <Text
            accessibilityLiveRegion="polite"
            style={{ ...theme.typography.small, color: theme.colors.textMuted }}
          >
            Sin conexión · no se puede confirmar ahora.
          </Text>
        )}

        {pending.isLoading && (
          <View style={{ gap: theme.spacing.sm as number }}>
            <Skeleton height={72} radius={theme.radius.card} />
            <Skeleton height={72} radius={theme.radius.card} />
          </View>
        )}

        {pending.isError && (
          <ErrorState
            title="No pudimos cargar tus cobros pendientes"
            onRetry={() => pending.refetch()}
          />
        )}

        {pending.isSuccess && pending.data.length === 0 && (
          <EmptyState title="No tienes viajes pendientes de confirmar cobro." />
        )}

        {pending.isSuccess &&
          pending.data.map((trip) => (
            <CashPendingRow
              key={trip.trip_request_id}
              trip={trip}
              loading={confirm.isPending && confirm.variables === trip.trip_request_id}
              disabled={isOffline}
              errorMessage={rowErrors[trip.trip_request_id]}
              onConfirm={() => handleConfirm(trip.trip_request_id)}
            />
          ))}
      </ScrollView>
    </SafeAreaView>
  );
}

import React, { useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  EmptyState,
  ErrorState,
  OfflineState,
  PriceTag,
  ProgressRail,
  ScreenHeader,
  SkeletonList,
  Stage,
  useDelayedLoading,
  useTheme,
} from '@voyyaa/ui-mobile';
import { isNetworkError, useNetworkStatus } from '@voyyaa/app-runtime';
import { CashPendingRow } from '../src/components/CashPendingRow';
import { usePendingCashTrips } from '../src/hooks/usePendingCashTrips';
import {
  useConfirmCashCollected,
  useRemovePendingCashTrip,
} from '../src/hooks/useConfirmCashCollected';
import { driverCopy } from '../src/copy/driver-copy';

const REFETCH_RAIL_DELAY_MS = 400;

export default function CashPendingScreen(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const networkStatus = useNetworkStatus();
  const isOffline = networkStatus === 'offline';

  const pending = usePendingCashTrips();
  const confirm = useConfirmCashCollected();
  const removeFromList = useRemovePendingCashTrip();
  const [rowErrors, setRowErrors] = useState<Record<number, string | undefined>>({});
  const [settledIds, setSettledIds] = useState<readonly number[]>([]);
  const [pulling, setPulling] = useState(false);
  const showRail = useDelayedLoading((pending.isRefetching || pulling) && !pending.isLoading, {
    delayMs: REFETCH_RAIL_DELAY_MS,
  });

  const trips = pending.data ?? [];
  const openTrips = trips.filter((trip) => !settledIds.includes(trip.trip_request_id));
  const total = openTrips.reduce((sum, trip) => sum + trip.fare, 0);

  function handleConfirm(tripRequestId: number): void {
    setRowErrors((current) => ({ ...current, [tripRequestId]: undefined }));
    confirm.mutate(tripRequestId, {
      onSuccess: () => setSettledIds((current) => [...current, tripRequestId]),
      onError: () =>
        setRowErrors((current) => ({
          ...current,
          [tripRequestId]: driverCopy.cash.rowError,
        })),
    });
  }

  function handleFolded(tripRequestId: number): void {
    removeFromList(tripRequestId);
    setSettledIds((current) => current.filter((id) => id !== tripRequestId));
  }

  function handleRefresh(): void {
    setPulling(true);
    void pending.refetch().finally(() => setPulling(false));
  }

  const showSummary = pending.isSuccess && openTrips.length > 0;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <Stage topInset={insets.top}>
        <ScreenHeader title={driverCopy.cash.title} tone="stage" onBack={() => router.back()} />
        {showSummary && (
          <View
            testID="cash-summary"
            style={{
              paddingHorizontal: theme.spacing.gutter,
              paddingBottom: theme.spacing.xl,
              gap: theme.spacing.xs,
            }}
          >
            <Text style={{ ...theme.typography.eyebrow, color: theme.colors.onStageMuted }}>
              {driverCopy.cash.headerEyebrow}
            </Text>
            <PriceTag amountCOP={total} size="xl" color={theme.colors.onStage} />
            <Text style={{ ...theme.typography.small, color: theme.colors.onStageMuted }}>
              {driverCopy.cash.headerCaption(openTrips.length)}
            </Text>
          </View>
        )}
      </Stage>
      {showRail && <ProgressRail />}

      <ScrollView
        contentContainerStyle={{
          padding: theme.spacing.lg,
          paddingBottom: insets.bottom + theme.spacing.xl,
          gap: theme.spacing.sm,
        }}
        refreshControl={
          <RefreshControl
            refreshing={pulling}
            onRefresh={handleRefresh}
            colors={[theme.colors.brand]}
            progressBackgroundColor={theme.colors.surfaceRaised}
            tintColor={theme.colors.brandInk}
          />
        }
      >
        {isOffline && (
          <Text
            accessibilityLiveRegion="polite"
            style={{ ...theme.typography.small, color: theme.colors.infoInk }}
          >
            {driverCopy.cash.offline}
          </Text>
        )}

        {pending.isLoading && <SkeletonList count={3} variant="request" />}

        {pending.isError &&
          (isNetworkError(pending.error) ? (
            <OfflineState onRetry={() => pending.refetch()} />
          ) : (
            <ErrorState title={driverCopy.cash.loadError} onRetry={() => pending.refetch()} />
          ))}

        {pending.isSuccess && trips.length === 0 && (
          <EmptyState
            glyph="success"
            title={driverCopy.cash.emptyTitle}
            body={driverCopy.cash.emptyBody}
          />
        )}

        {pending.isSuccess &&
          trips.map((trip) => (
            <CashPendingRow
              key={trip.trip_request_id}
              trip={trip}
              loading={confirm.isPending && confirm.variables === trip.trip_request_id}
              disabled={isOffline}
              confirmed={settledIds.includes(trip.trip_request_id)}
              errorMessage={rowErrors[trip.trip_request_id]}
              onConfirm={() => handleConfirm(trip.trip_request_id)}
              onFolded={() => handleFolded(trip.trip_request_id)}
            />
          ))}
      </ScrollView>
    </View>
  );
}

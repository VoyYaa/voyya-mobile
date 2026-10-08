import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, FlatList, RefreshControl, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Chip,
  EmptyState,
  ErrorState,
  OfflineState,
  ProgressRail,
  ScreenHeader,
  SkeletonList,
  useDelayedLoading,
  useTheme,
} from '@voyyaa/ui-mobile';
import { isNetworkError, useNetworkStatus } from '@voyyaa/app-runtime';
import type { AssignmentNotification } from '@voyyaa/shared';
import { OffShiftPanel } from '../../src/components/OffShiftPanel';
import { RequestRow } from '../../src/components/RequestRow';
import { AssignmentRulesCard } from '../../src/components/AssignmentRulesCard';
import { useDriverHome } from '../../src/hooks/useDriverHome';
import { useNearbyOffers } from '../../src/hooks/useNearbyOffers';
import { driverCopy } from '../../src/copy/driver-copy';
import {
  SEARCH_RADIUS_FALLBACK_KM,
  ACCEPTANCE_TIMEOUT_FALLBACK_SEC,
} from '../../src/constants/parameters';

const REFETCH_RAIL_DELAY_MS = 400;

function sortByProximity(items: readonly AssignmentNotification[]): AssignmentNotification[] {
  return [...items].sort((a, b) => a.distance_to_origin_m - b.distance_to_origin_m);
}

export default function RequestsScreen(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const home = useDriverHome();
  const onShift = home.data?.shift.status === 'available';
  const networkStatus = useNetworkStatus();
  const isOffline = networkStatus === 'offline';

  const offers = useNearbyOffers(onShift);
  const loadingAnnounced = useRef(false);
  const [pulling, setPulling] = useState(false);
  const showRail = useDelayedLoading((offers.isRefetching || pulling) && !offers.isLoading, {
    delayMs: REFETCH_RAIL_DELAY_MS,
  });

  useEffect(() => {
    if (onShift && offers.isLoading && !loadingAnnounced.current) {
      loadingAnnounced.current = true;
      AccessibilityInfo.announceForAccessibility(driverCopy.requests.loadingAnnouncement);
    }
    if (!offers.isLoading) {
      loadingAnnounced.current = false;
    }
  }, [onShift, offers.isLoading]);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!isOffline) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [isOffline]);
  const secondsSinceUpdate = offers.dataUpdatedAt
    ? Math.max(0, Math.round((now - offers.dataUpdatedAt) / 1000))
    : null;

  const sortedData = offers.data ? sortByProximity(offers.data) : [];
  const hasData = sortedData.length > 0;

  const handleRefresh = (): void => {
    setPulling(true);
    void offers.refetch().finally(() => setPulling(false));
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg, paddingTop: insets.top }}>
      <ScreenHeader
        title={driverCopy.requests.title}
        onBack={() => router.back()}
        right={
          onShift && hasData ? <Chip label={String(sortedData.length)} tone="brand" /> : undefined
        }
      />
      {showRail && <ProgressRail />}

      {!onShift ? (
        <View style={{ flex: 1, padding: theme.spacing.lg }}>
          <OffShiftPanel onActivate={() => router.replace('/')} />
        </View>
      ) : (
        <FlatList
          data={sortedData}
          keyExtractor={(item) => String(item.assignment_id)}
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
          ListHeaderComponent={
            <View style={{ gap: theme.spacing.sm, marginBottom: theme.spacing.sm }}>
              <Text style={{ ...theme.typography.body, color: theme.colors.textMuted }}>
                {driverCopy.requests.hint}
              </Text>
              {isOffline && (
                <Text
                  accessibilityLiveRegion="polite"
                  style={{ ...theme.typography.small, color: theme.colors.infoInk }}
                >
                  {driverCopy.requests.offline}
                  {secondsSinceUpdate !== null
                    ? driverCopy.requests.updatedAgo(secondsSinceUpdate)
                    : ''}
                </Text>
              )}
              {offers.isLoading && <SkeletonList count={3} variant="request" />}
              {offers.isError &&
                (isNetworkError(offers.error) ? (
                  <OfflineState onRetry={() => offers.refetch()} />
                ) : (
                  <ErrorState
                    title={driverCopy.home.offersLoadError}
                    onRetry={() => offers.refetch()}
                  />
                ))}
              {offers.isSuccess && !hasData && (
                <EmptyState
                  glyph="empty"
                  title={driverCopy.requests.emptyTitle}
                  body={driverCopy.requests.emptyBody}
                  secondaryAction={{
                    label: driverCopy.requests.reviewShift,
                    onPress: () => router.push('/'),
                    variant: 'ghost',
                  }}
                />
              )}
            </View>
          }
          renderItem={({ item, index }) => (
            <View style={{ opacity: isOffline ? 0.6 : 1 }}>
              <RequestRow
                originLabel={item.origin.address}
                destinationLabel={item.dropoff_neighborhood}
                distanceToPickup={`${item.distance_to_origin_m} m`}
                price={item.total_fare}
                isNearest={index === 0}
                onPress={() =>
                  router.push({
                    pathname: '/requests/[id]',
                    params: { id: String(item.assignment_id) },
                  })
                }
              />
            </View>
          )}
          ListFooterComponent={
            hasData ? (
              <AssignmentRulesCard
                radiusKm={SEARCH_RADIUS_FALLBACK_KM}
                timeoutSec={ACCEPTANCE_TIMEOUT_FALLBACK_SEC}
              />
            ) : null
          }
        />
      )}
    </View>
  );
}

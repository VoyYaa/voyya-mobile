import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, FlatList, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Chip, EmptyState, ErrorState, useTheme } from '@voyyaa/ui-mobile';
import type { AssignmentNotification } from '@voyyaa/shared';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { OffShiftPanel } from '../../src/components/OffShiftPanel';
import { RequestRow } from '../../src/components/RequestRow';
import { RequestListSkeleton } from '../../src/components/RequestListSkeleton';
import { AssignmentRulesCard } from '../../src/components/AssignmentRulesCard';
import { useShiftStore } from '../../src/state/useShiftStore';
import { useNearbyOffers } from '../../src/hooks/useNearbyOffers';
import { useNetworkStatus } from '../../src/hooks/useNetworkStatus';
import {
  SEARCH_RADIUS_FALLBACK_KM,
  ACCEPTANCE_TIMEOUT_FALLBACK_SEC,
} from '../../src/constants/parameters';

function sortByProximity(items: readonly AssignmentNotification[]): AssignmentNotification[] {
  return [...items].sort((a, b) => a.distance_to_origin_m - b.distance_to_origin_m);
}

export default function RequestsScreen(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const onShift = useShiftStore((s) => s.onShift);
  const startShift = useShiftStore((s) => s.startShift);
  const networkStatus = useNetworkStatus();
  const isOffline = networkStatus === 'offline';

  const offers = useNearbyOffers(onShift);
  const loadingAnnounced = useRef(false);

  useEffect(() => {
    if (onShift && offers.isLoading && !loadingAnnounced.current) {
      loadingAnnounced.current = true;
      AccessibilityInfo.announceForAccessibility('Cargando solicitudes cercanas');
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <ScreenHeader
        title="Solicitudes activas"
        right={
          onShift && hasData ? (
            <Chip label={String(sortedData.length)} tone="brand" />
          ) : undefined
        }
      />

      {!onShift ? (
        <View style={{ flex: 1, padding: theme.spacing.lg }}>
          <OffShiftPanel onActivate={startShift} />
        </View>
      ) : (
        <FlatList
          data={sortedData}
          keyExtractor={(item) => String(item.assignment_id)}
          contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.sm as number }}
          ListHeaderComponent={
            <View style={{ gap: theme.spacing.sm as number, marginBottom: theme.spacing.sm }}>
              <Text style={{ ...theme.typography.body, color: theme.colors.textMuted }}>
                Toca una solicitud para ver el detalle y aceptarla.
              </Text>
              {isOffline && (
                <Text
                  accessibilityLiveRegion="polite"
                  style={{ ...theme.typography.small, color: theme.colors.textMuted }}
                >
                  Sin conexión · reintentando…
                  {secondsSinceUpdate !== null
                    ? ` Actualizado hace ${secondsSinceUpdate} s.`
                    : ''}
                </Text>
              )}
              {offers.isLoading && <RequestListSkeleton />}
              {offers.isError && (
                <ErrorState
                  title="No pudimos cargar tus solicitudes"
                  onRetry={() => offers.refetch()}
                />
              )}
              {offers.isSuccess && !hasData && (
                <EmptyState
                  icon="🕐"
                  title="Sin solicitudes cercanas"
                  body="Te avisaremos apenas llegue una solicitud cerca de ti. Sigues visible para los pasajeros."
                  secondaryAction={{
                    label: 'Revisar mi turno y zona',
                    onPress: () => router.push('/'),
                    variant: 'ghost',
                  }}
                />
              )}
            </View>
          }
          renderItem={({ item, index }) => (
            <View style={{ opacity: isOffline ? 0.6 : 1, marginBottom: theme.spacing.sm }}>
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
                radioKm={SEARCH_RADIUS_FALLBACK_KM}
                timeoutSeg={ACCEPTANCE_TIMEOUT_FALLBACK_SEC}
              />
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

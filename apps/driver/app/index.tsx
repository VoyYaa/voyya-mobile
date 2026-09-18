import React, { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, ErrorState, Skeleton, useTheme } from '@voyyaa/ui-mobile';
import { LOCATION_NOTICE_VERSION } from '@voyyaa/shared';
import { confirmConsent, hasSeenLocalConsent, useLogout } from '@voyyaa/app-runtime';
import { ShiftToggle } from '../src/components/ShiftToggle';
import { ShiftIssuePanel, type ShiftIssueKind } from '../src/components/ShiftIssuePanel';
import { AssignmentRulesCard } from '../src/components/AssignmentRulesCard';
import { OffShiftPanel } from '../src/components/OffShiftPanel';
import { RequestRow } from '../src/components/RequestRow';
import { RequestListSkeleton } from '../src/components/RequestListSkeleton';
import { PendingCashBanner } from '../src/components/PendingCashBanner';
import { LocationIssueBanner } from '../src/components/LocationIssueBanner';
import {
  LocationConsentSheet,
  type LocationConsentSheetMode,
} from '../src/components/LocationConsentSheet';
import { useDriverHome } from '../src/hooks/useDriverHome';
import { useShiftActivation, type ShiftActivationPhase } from '../src/hooks/useShiftActivation';
import { useNearbyOffers } from '../src/hooks/useNearbyOffers';
import { usePendingCashTrips } from '../src/hooks/usePendingCashTrips';
import { useBestEffortLocationReport } from '../src/hooks/useReportLocation';
import { useLocationIssueStore } from '../src/state/useLocationIssueStore';
import {
  SEARCH_RADIUS_FALLBACK_KM,
  ACCEPTANCE_TIMEOUT_FALLBACK_SEC,
  LOCATION_REFRESH_MS,
} from '../src/constants/parameters';

function issueFromPhase(phase: ShiftActivationPhase): ShiftIssueKind | null {
  switch (phase) {
    case 'permission_denied':
    case 'gps_disabled':
    case 'offline':
    case 'server_error':
    case 'blocked_by_trip':
      return phase;
    default:
      return null;
  }
}

export default function HomeScreen(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const logout = useLogout();

  const home = useDriverHome();
  const shiftActivation = useShiftActivation();
  const pendingCash = usePendingCashTrips();

  const shift = home.data?.shift;
  const activeTrip = home.data?.active_trip ?? null;
  const isOnShift = shift?.status === 'available';
  const reportLocationBestEffort = useBestEffortLocationReport();
  const locationIssue = useLocationIssueStore((s) => s.issue);
  const setLocationIssue = useLocationIssueStore((s) => s.setIssue);

  const [consentVisible, setConsentVisible] = useState(false);
  const [consentMode, setConsentMode] = useState<LocationConsentSheetMode>('consent');

  const offers = useNearbyOffers(isOnShift);
  const firstOffer = offers.data?.[0];

  useEffect(() => {
    if (activeTrip) {
      router.replace({
        pathname: '/trip/[id]',
        params: { id: String(activeTrip.trip_request_id) },
      });
    }
  }, [activeTrip, router]);

  useEffect(() => {
    if (!isOnShift) return;
    const interval = setInterval(reportLocationBestEffort, LOCATION_REFRESH_MS);
    return () => clearInterval(interval);
  }, [isOnShift, reportLocationBestEffort]);

  useEffect(() => {
    if (!isOnShift) setLocationIssue(null);
  }, [isOnShift, setLocationIssue]);

  if (activeTrip) {
    return <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} />;
  }

  if (home.isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
        <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.lg }}>
          <Skeleton height={72} radius={theme.radius.card} />
          <Skeleton height={96} radius={theme.radius.card} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (home.isError || !shift) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
        <ErrorState title="No pudimos cargar tu estado de turno" onRetry={() => home.refetch()} />
      </SafeAreaView>
    );
  }

  const issue = issueFromPhase(shiftActivation.phase);

  const handleShiftAction = (): void => {
    if (shift.on_shift) {
      shiftActivation.deactivate();
      return;
    }
    void hasSeenLocalConsent('location', LOCATION_NOTICE_VERSION).then((seen) => {
      if (seen) {
        shiftActivation.activate();
        return;
      }
      setConsentMode('consent');
      setConsentVisible(true);
    });
  };

  const handleConsentContinue = (): void => {
    setConsentVisible(false);
    void confirmConsent('location', LOCATION_NOTICE_VERSION);
    shiftActivation.activate();
  };

  const handleConsentDismiss = (): void => {
    setConsentVisible(false);
  };

  const handleReviewPrivacy = (): void => {
    setConsentMode('review');
    setConsentVisible(true);
  };

  const handleIssueAction = (kind: ShiftIssueKind): void => {
    if (kind === 'permission_denied' || kind === 'gps_disabled') {
      void Linking.openSettings();
      shiftActivation.dismissIssue();
      return;
    }
    if (kind === 'offline' || kind === 'server_error') {
      shiftActivation.retry();
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <View
        style={{
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.lg,
          gap: theme.spacing.sm,
        }}
      >
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Text style={{ ...theme.typography.title, color: theme.colors.brandPressed }}>
            VoyYa Conductor
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cerrar sesión"
            hitSlop={8}
            onPress={() => logout.mutate()}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: theme.colors.surfaceAlt,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ ...theme.typography.small, color: theme.colors.text }}>Yo</Text>
          </Pressable>
        </View>

        <Text
          accessibilityRole="link"
          onPress={handleReviewPrivacy}
          style={{ ...theme.typography.small, color: theme.colors.textMuted }}
        >
          Privacidad de mi ubicación
        </Text>

        {locationIssue && (
          <LocationIssueBanner
            kind={locationIssue}
            onOpenSettings={() => void Linking.openSettings()}
          />
        )}
      </View>

      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.lg }}>
        <ShiftToggle
          checked={shift.on_shift}
          busy={shiftActivation.isBusy}
          disabled={!shift.vehicle_linked}
          onToggle={handleShiftAction}
        />

        {!shift.vehicle_linked && <ShiftIssuePanel kind="no_vehicle" />}

        {issue && <ShiftIssuePanel kind={issue} onAction={() => handleIssueAction(issue)} />}

        <PendingCashBanner
          count={pendingCash.data?.length ?? 0}
          onPress={() => router.push('/cash-pending')}
        />

        <Card>
          <Text style={{ ...theme.typography.subtitle, color: theme.colors.text }}>
            Resumen de hoy
          </Text>
          <Text style={{ ...theme.typography.small, color: theme.colors.textMuted, marginTop: 2 }}>
            Placeholder · aún no hay un endpoint de resumen de viajes/ingresos del conductor.
          </Text>
          <View
            style={{ flexDirection: 'row', gap: theme.spacing.xl, marginTop: theme.spacing.sm }}
          >
            <View>
              <Text style={{ ...theme.typography.numeric, fontSize: 20, color: theme.colors.text }}>
                0
              </Text>
              <Text style={{ ...theme.typography.small, color: theme.colors.textMuted }}>
                Viajes
              </Text>
            </View>
            <View>
              <Text style={{ ...theme.typography.numeric, fontSize: 20, color: theme.colors.text }}>
                $0
              </Text>
              <Text style={{ ...theme.typography.small, color: theme.colors.textMuted }}>
                Recaudo
              </Text>
            </View>
          </View>
        </Card>

        <View style={{ gap: theme.spacing.sm as number }}>
          <Text style={{ ...theme.typography.subtitle, color: theme.colors.text }}>
            Solicitudes cercanas
          </Text>

          {!isOnShift && <OffShiftPanel onActivate={handleShiftAction} />}

          {isOnShift && offers.isLoading && <RequestListSkeleton count={1} />}

          {isOnShift && offers.isError && (
            <ErrorState
              title="No pudimos cargar tus solicitudes"
              onRetry={() => offers.refetch()}
            />
          )}

          {isOnShift && offers.isSuccess && offers.data.length === 0 && (
            <Text style={{ ...theme.typography.body, color: theme.colors.textMuted }}>
              Sin solicitudes cercanas por ahora. Sigues visible para los pasajeros.
            </Text>
          )}

          {isOnShift && firstOffer && (
            <>
              <RequestRow
                originLabel={firstOffer.origin.address}
                destinationLabel={firstOffer.dropoff_neighborhood}
                distanceToPickup={`${firstOffer.distance_to_origin_m} m`}
                price={firstOffer.total_fare}
                isNearest
                onPress={() =>
                  router.push({
                    pathname: '/requests/[id]',
                    params: { id: String(firstOffer.assignment_id) },
                  })
                }
              />
              <Text
                accessibilityRole="link"
                onPress={() => router.push('/requests')}
                style={{
                  ...theme.typography.small,
                  fontWeight: '700',
                  color: theme.colors.brandInk,
                }}
              >
                Ver todas ({offers.data?.length ?? 0})
              </Text>
            </>
          )}
        </View>

        <AssignmentRulesCard
          radioKm={SEARCH_RADIUS_FALLBACK_KM}
          timeoutSeg={ACCEPTANCE_TIMEOUT_FALLBACK_SEC}
        />
      </ScrollView>

      <LocationConsentSheet
        visible={consentVisible}
        mode={consentMode}
        onContinue={handleConsentContinue}
        onDismiss={handleConsentDismiss}
      />
    </SafeAreaView>
  );
}

import React, { useCallback, useEffect, useState } from 'react';
import { Linking, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AccountSheet,
  EmptyState,
  ErrorState,
  LinkButton,
  OfflineState,
  ProgressRail,
  Skeleton,
  SkeletonList,
  useDelayedLoading,
  useTheme,
} from '@voyyaa/ui-mobile';
import {
  resolveLocationConsentConfirmed,
  isNetworkError,
  useLogout,
  useSessionStore,
} from '@voyyaa/app-runtime';
import { ShiftHero } from '../src/components/ShiftHero';
import { ShiftSwitch } from '../src/components/ShiftSwitch';
import { ShiftIssuePanel, type ShiftIssueKind } from '../src/components/ShiftIssuePanel';
import { AssignmentRulesCard } from '../src/components/AssignmentRulesCard';
import { RequestRow } from '../src/components/RequestRow';
import { PendingCashBanner } from '../src/components/PendingCashBanner';
import { LocationIssueBanner } from '../src/components/LocationIssueBanner';
import { OfferBanner } from '../src/components/OfferBanner';
import { LocationConsentSheet } from '../src/components/LocationConsentSheet';
import { useDriverHome } from '../src/hooks/useDriverHome';
import { useIsAuthenticated } from '../src/hooks/useIsAuthenticated';
import { useShiftActivation, type ShiftActivationPhase } from '../src/hooks/useShiftActivation';
import { useNearbyOffers } from '../src/hooks/useNearbyOffers';
import { useNewOfferAlert } from '../src/hooks/useNewOfferAlert';
import { usePendingCashTrips } from '../src/hooks/usePendingCashTrips';
import { useBestEffortLocationReport } from '../src/hooks/useReportLocation';
import { useLocationIssueStore } from '../src/state/useLocationIssueStore';
import { revokeCurrentPushToken } from '../src/notifications/push-registration';
import { driverCopy } from '../src/copy/driver-copy';
import {
  SEARCH_RADIUS_FALLBACK_KM,
  ACCEPTANCE_TIMEOUT_FALLBACK_SEC,
  LOCATION_REFRESH_MS,
} from '../src/constants/parameters';

const HERO_SKELETON_HEIGHT = 168;
const REFETCH_RAIL_DELAY_MS = 400;

function issueFromPhase(phase: ShiftActivationPhase): ShiftIssueKind | null {
  switch (phase) {
    case 'permission_denied':
    case 'gps_disabled':
    case 'location_timeout':
    case 'offline':
    case 'server_error':
    case 'blocked_by_trip':
    case 'consent_required':
      return phase;
    default:
      return null;
  }
}

export default function HomeScreen(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const logout = useLogout();
  const authenticated = useIsAuthenticated();
  const user = useSessionStore((s) => s.user);

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
  const [accountVisible, setAccountVisible] = useState(false);
  const [pulling, setPulling] = useState(false);

  const offers = useNearbyOffers(isOnShift);
  const firstOffer = offers.data?.[0];
  const offerAlert = useNewOfferAlert(offers.data);
  const showRefetchRail = useDelayedLoading(
    (home.isRefetching || offers.isRefetching || pulling) && !home.isLoading,
    { delayMs: REFETCH_RAIL_DELAY_MS },
  );

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

  const activationPhase = shiftActivation.phase;
  useEffect(() => {
    if (activationPhase === 'consent_required') setConsentVisible(true);
  }, [activationPhase]);

  useEffect(() => {
    if (!isOnShift) setLocationIssue(null);
  }, [isOnShift, setLocationIssue]);

  const handleRefresh = useCallback((): void => {
    setPulling(true);
    void Promise.allSettled([home.refetch(), offers.refetch(), pendingCash.refetch()]).finally(() =>
      setPulling(false),
    );
  }, [home, offers, pendingCash]);

  if (!authenticated || activeTrip) {
    return <View style={{ flex: 1, backgroundColor: theme.colors.bg }} />;
  }

  if (home.isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.bg }} testID="home-loading">
        <Skeleton height={HERO_SKELETON_HEIGHT + insets.top} radius={0} />
        <View style={{ padding: theme.spacing.lg, gap: theme.spacing.lg }}>
          <Skeleton height={72} radius={theme.radius.card} />
          <SkeletonList count={2} variant="request" />
        </View>
      </View>
    );
  }

  if (home.isError || !shift) {
    return (
      <View
        style={{ flex: 1, backgroundColor: theme.colors.bg, paddingTop: insets.top }}
        testID="home-error"
      >
        {isNetworkError(home.error) ? (
          <OfflineState onRetry={() => home.refetch()} />
        ) : (
          <ErrorState title={driverCopy.home.homeLoadError} onRetry={() => home.refetch()} />
        )}
      </View>
    );
  }

  const issue = issueFromPhase(shiftActivation.phase);
  const driverName = user?.first_name ?? undefined;

  const handleLogout = (): void => {
    void revokeCurrentPushToken().finally(() => logout.mutate());
  };

  const handleShiftAction = (): void => {
    if (shift.on_shift) {
      shiftActivation.deactivate();
      return;
    }
    void resolveLocationConsentConfirmed().then((seen) => {
      if (seen) {
        shiftActivation.activate();
        return;
      }
      setConsentVisible(true);
    });
  };

  const handleConsentAccepted = (): void => {
    setConsentVisible(false);
    if (isOnShift) {
      setLocationIssue(null);
      reportLocationBestEffort();
      return;
    }
    shiftActivation.activate();
  };

  const handleConsentDismiss = (): void => {
    setConsentVisible(false);
    if (shiftActivation.phase === 'consent_required') shiftActivation.dismissIssue();
  };

  const handleOpenPrivacy = (): void => {
    setAccountVisible(false);
    router.push('/privacy');
  };

  const handleLocationIssuePress = (): void => {
    if (locationIssue === 'consent_required') {
      setConsentVisible(true);
      return;
    }
    void Linking.openSettings();
  };

  const handleIssueAction = (kind: ShiftIssueKind): void => {
    if (kind === 'permission_denied' || kind === 'gps_disabled') {
      void Linking.openSettings();
      shiftActivation.dismissIssue();
      return;
    }
    if (kind === 'consent_required') {
      setConsentVisible(true);
      return;
    }
    if (kind === 'offline' || kind === 'server_error' || kind === 'location_timeout') {
      shiftActivation.retry();
    }
  };

  const openOffer = (assignmentId: number): void => {
    offerAlert.dismiss();
    router.push({ pathname: '/requests/[id]', params: { id: String(assignmentId) } });
  };

  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || undefined;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <ShiftHero
        onShift={isOnShift}
        topInset={insets.top}
        driverName={driverName}
        onAvatarPress={() => setAccountVisible(true)}
      />
      {showRefetchRail && <ProgressRail />}

      <ScrollView
        contentContainerStyle={{
          padding: theme.spacing.lg,
          paddingBottom: insets.bottom + theme.spacing.xl,
          gap: theme.spacing.lg,
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
        {locationIssue && (
          <LocationIssueBanner kind={locationIssue} onPress={handleLocationIssuePress} />
        )}

        <ShiftSwitch
          checked={shift.on_shift}
          busy={shiftActivation.isBusy}
          disabled={!shift.vehicle_linked}
          onToggle={handleShiftAction}
        />

        {issue && <ShiftIssuePanel kind={issue} onAction={() => handleIssueAction(issue)} />}

        <PendingCashBanner
          count={pendingCash.data?.length ?? 0}
          onPress={() => router.push('/cash-pending')}
        />

        {isOnShift && (
          <View style={{ gap: theme.spacing.md }}>
            <Text
              accessibilityRole="header"
              style={{ ...theme.typography.title, color: theme.colors.text }}
            >
              {driverCopy.home.nearbyTitle}
            </Text>

            {offers.isLoading && <SkeletonList count={1} variant="request" />}

            {offers.isError &&
              (isNetworkError(offers.error) ? (
                <OfflineState onRetry={() => offers.refetch()} />
              ) : (
                <ErrorState
                  title={driverCopy.home.offersLoadError}
                  onRetry={() => offers.refetch()}
                />
              ))}

            {offers.isSuccess && offers.data.length === 0 && (
              <EmptyState
                glyph="empty"
                title={driverCopy.home.emptyTitle}
                body={driverCopy.home.emptyBody}
              />
            )}

            {firstOffer && (
              <>
                <RequestRow
                  originLabel={firstOffer.origin.address}
                  destinationLabel={firstOffer.dropoff_neighborhood}
                  distanceToPickup={`${firstOffer.distance_to_origin_m} m`}
                  price={firstOffer.total_fare}
                  isNearest
                  onPress={() => openOffer(firstOffer.assignment_id)}
                />
                <LinkButton
                  label={driverCopy.home.seeAll(offers.data?.length ?? 0)}
                  onPress={() => router.push('/requests')}
                  testID="see-all-requests"
                />
              </>
            )}
          </View>
        )}

        <AssignmentRulesCard
          radiusKm={SEARCH_RADIUS_FALLBACK_KM}
          timeoutSec={ACCEPTANCE_TIMEOUT_FALLBACK_SEC}
        />
      </ScrollView>

      <OfferBanner offer={offerAlert.offer} topInset={insets.top} onPress={openOffer} />

      <LocationConsentSheet
        visible={consentVisible}
        mode="shift"
        onAccepted={handleConsentAccepted}
        onDismiss={handleConsentDismiss}
      />
      <AccountSheet
        visible={accountVisible}
        onClose={() => setAccountVisible(false)}
        name={fullName}
        onPrivacy={handleOpenPrivacy}
        onLogout={handleLogout}
        loggingOut={logout.isPending}
      />
    </View>
  );
}

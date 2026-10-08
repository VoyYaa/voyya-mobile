import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import {
  AccountAvatar,
  AccountSheet,
  BrandMark,
  Chip,
  LinkButton,
  Map,
  PointRow,
  Skeleton,
  Toast,
  uiCopy,
  useTheme,
} from '@voyyaa/ui-mobile';
import {
  useGrantLocationConsent,
  useLogout,
  useNetworkStatus,
  useSessionStore,
} from '@voyyaa/app-runtime';
import { CoverageBlockedPanel } from '../src/components/CoverageBlockedPanel';
import { ActiveTripCard } from '../src/components/ActiveTripCard';
import { InlineNotice } from '../src/components/InlineNotice';
import { LocatingPill } from '../src/components/LocatingPill';
import { LocationConsentSheet } from '../src/components/LocationConsentSheet';
import { NoOriginPanel } from '../src/components/NoOriginPanel';
import { useActiveTrip, useActiveTripCache } from '../src/hooks/useActiveTrip';
import { useCoverageGate } from '../src/hooks/useCoverageGate';
import { useLocationConsentGate } from '../src/hooks/useLocationConsentGate';
import type { LocationConsentPhase } from '../src/lib/consent-phase';
import { useResolveOrigin } from '../src/hooks/useResolveOrigin';
import { useTripDraftStore } from '../src/state/useTripDraftStore';
import { TRIP_ENDED_NOTICE } from '../src/constants/notices';
import { YARUMAL_CENTER } from '../src/constants/demo-places';
import { POIS_YARUMAL } from '../src/constants/pois-yarumal';
import { activeTripRoute } from '../src/lib/active-trip-route';
import { passengerCopy } from '../src/copy/passenger-copy';

const MAP_HEIGHT_RATIO = 0.58;
const MAP_MIN_HEIGHT = 200;
const SHEET_MIN_HEIGHT = 340;
const MAX_PLACE_CHIPS = 4;
const SEARCH_BUTTON_HEIGHT = 60;

function Chevron({ color }: { color: string }): React.JSX.Element {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Path
        d="M9.5 5.5 L16 12 L9.5 18.5"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

export default function HomeScreen(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const { notice } = useLocalSearchParams<{ notice?: string }>();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const copy = passengerCopy.home;
  const networkStatus = useNetworkStatus();
  const user = useSessionStore((s) => s.user);
  const municipalityId = useTripDraftStore((s) => s.municipalityId);
  const origin = useTripDraftStore((s) => s.origin);
  const destination = useTripDraftStore((s) => s.destination);
  const setOrigin = useTripDraftStore((s) => s.setOrigin);
  const clearOrigin = useTripDraftStore((s) => s.clearOrigin);
  const coverage = useCoverageGate(origin, municipalityId);
  const resolveOrigin = useResolveOrigin();
  const logout = useLogout();

  const gate = useLocationConsentGate();
  const grant = useGrantLocationConsent();
  const activeTrip = useActiveTrip();
  const activeTripCache = useActiveTripCache();
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [accountVisible, setAccountVisible] = useState(false);
  const [endedToast, setEndedToast] = useState(false);
  const lastPhase = useRef<LocationConsentPhase | null>(null);
  const trip = activeTrip.data ?? null;

  const { refetch: refetchActiveTrip } = activeTrip;
  useFocusEffect(
    useCallback(() => {
      void refetchActiveTrip({ cancelRefetch: false });
    }, [refetchActiveTrip]),
  );

  useEffect(() => {
    if (notice === TRIP_ENDED_NOTICE) {
      setEndedToast(true);
      router.setParams({ notice: undefined });
    }
  }, [notice]);

  useEffect(() => {
    const previous = lastPhase.current;
    lastPhase.current = gate.phase;
    if (gate.phase === 'needs_notice') setNoticeOpen(true);
    if (gate.phase === 'confirmed') {
      setNoticeOpen(false);
      if (previous !== 'confirmed' && !origin) resolveOrigin.resolve();
    }
  }, [gate.phase]);

  useEffect(() => {
    if (resolveOrigin.status === 'resolved' && resolveOrigin.origin) {
      setOrigin(resolveOrigin.origin, 'gps');
    }
  }, [resolveOrigin.status, resolveOrigin.origin, setOrigin]);

  const handleAcceptNotice = (): void => {
    grant.mutate(undefined, {
      onSuccess: () => setNoticeOpen(false),
      onError: () => setNoticeOpen(false),
    });
  };

  const handleDismissNotice = (): void => {
    if (grant.isPending) return;
    setNoticeOpen(false);
  };

  const handleOpenPrivacy = (): void => {
    setAccountVisible(false);
    router.push('/privacy');
  };

  const handleOpenTrip = (): void => {
    if (!trip) return;
    const route = activeTripRoute(trip);
    if (!route) return;
    activeTripCache.seed(trip);
    router.push(route);
  };

  const handleChangeOrigin = (): void => {
    clearOrigin();
    router.push('/destination');
  };

  const handleUseMyLocation = (): void => {
    if (gate.phase === 'unknown') {
      gate.retry();
      return;
    }
    if (gate.phase !== 'confirmed') {
      grant.reset();
      setNoticeOpen(true);
      return;
    }
    if (!resolveOrigin.canAskAgain) {
      void Linking.openSettings();
      return;
    }
    resolveOrigin.resolve();
  };

  if (coverage.status === 'outside') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
        <CoverageBlockedPanel onAdjustLocation={coverage.retry} />
      </SafeAreaView>
    );
  }

  const isResolving = resolveOrigin.status === 'resolving';
  const mapHeight = Math.round(
    Math.max(
      MAP_MIN_HEIGHT,
      Math.min(windowHeight * MAP_HEIGHT_RATIO, windowHeight - SHEET_MIN_HEIGHT),
    ),
  );
  const showMapSkeleton = isResolving && !origin;
  const awaitingAutoResolve = gate.phase === 'confirmed' && resolveOrigin.status === 'idle';
  const showNoOrigin =
    !trip &&
    !origin &&
    !isResolving &&
    !noticeOpen &&
    gate.phase !== 'checking' &&
    !awaitingAutoResolve;
  const placeChips = POIS_YARUMAL.slice(0, MAX_PLACE_CHIPS);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <View style={{ height: mapHeight }}>
        {showMapSkeleton ? (
          <Skeleton accent height={mapHeight} radius={0} testID="home-map-skeleton" />
        ) : (
          <Map
            center={origin ? { lat: origin.lat, lng: origin.lng } : YARUMAL_CENTER}
            markers={
              origin
                ? [
                    {
                      id: 'current-location',
                      kind: 'origin',
                      coord: { lat: origin.lat, lng: origin.lng },
                      label: origin.address,
                    },
                  ]
                : []
            }
            interactive={false}
            height={mapHeight}
            style={{ borderRadius: 0, borderWidth: 0 }}
          />
        )}
        <View
          style={{
            position: 'absolute',
            top: insets.top + theme.spacing.sm,
            left: theme.spacing.gutter,
            right: theme.spacing.gutter,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View
            style={{
              backgroundColor: theme.colors.stage,
              borderRadius: theme.radius.pill,
              paddingVertical: theme.spacing.xs,
              paddingHorizontal: theme.spacing.md,
            }}
          >
            <BrandMark size={28} wordmark testID="home-brand" />
          </View>
          <AccountAvatar
            name={user?.first_name}
            onPress={() => setAccountVisible(true)}
            testID="account-avatar"
          />
        </View>
        {isResolving && (
          <View
            style={{
              position: 'absolute',
              left: theme.spacing.gutter,
              bottom: theme.spacing.xl + 8,
            }}
          >
            <LocatingPill />
          </View>
        )}
      </View>

      <ScrollView
        style={{
          flex: 1,
          marginTop: -theme.radius.sheet,
          backgroundColor: theme.colors.bg,
          borderTopLeftRadius: theme.radius.sheet,
          borderTopRightRadius: theme.radius.sheet,
        }}
        contentContainerStyle={{
          padding: theme.spacing.gutter,
          paddingBottom: theme.spacing.xl + insets.bottom,
          gap: theme.spacing.lg,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {trip ? (
          <ActiveTripCard
            trip={trip}
            originAddress={origin?.address}
            destinationAddress={destination?.address}
            onOpen={handleOpenTrip}
          />
        ) : (
          !showNoOrigin && (
            <Pressable
              onPress={() => router.push('/destination')}
              accessibilityRole="button"
              accessibilityLabel={copy.whereToLabel}
              testID="where-to-button"
              style={({ pressed }) => ({
                minHeight: SEARCH_BUTTON_HEIGHT,
                flexDirection: 'row',
                alignItems: 'center',
                gap: theme.spacing.md,
                paddingHorizontal: theme.spacing.lg,
                borderRadius: theme.radius.card,
                borderWidth: 1.5,
                borderColor: theme.colors.borderStrong,
                backgroundColor: pressed ? theme.colors.brandTint : theme.colors.surface,
              })}
            >
              <BrandMark size={32} tone="onLight" />
              <View style={{ flex: 1 }}>
                <Text style={{ ...theme.typography.subtitle, color: theme.colors.text }}>
                  {copy.whereTo}
                </Text>
                <Text style={{ ...theme.typography.small, color: theme.colors.textMuted }}>
                  {copy.whereToHint}
                </Text>
              </View>
              <Chevron color={theme.colors.text} />
            </Pressable>
          )
        )}

        {!trip && origin && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
            <View style={{ flex: 1 }}>
              <PointRow kind="origin" label={copy.originLabel} value={origin.address} />
            </View>
            <LinkButton
              label={copy.changeOrigin}
              onPress={handleChangeOrigin}
              testID="change-origin-link"
            />
          </View>
        )}

        {coverage.status === 'error' && (
          <InlineNotice
            tone="danger"
            glyph="error"
            title={copy.coverageErrorTitle}
            body={copy.coverageErrorBody}
            actionLabel={uiCopy.retry}
            onAction={coverage.retry}
            testID="home-coverage-error"
          />
        )}

        {grant.isError && !trip && (
          <InlineNotice
            tone="danger"
            glyph="error"
            title={copy.consentSaveErrorTitle}
            body={copy.consentSaveErrorBody}
            actionLabel={uiCopy.retry}
            onAction={handleAcceptNotice}
            testID="home-consent-error"
          />
        )}

        {showNoOrigin && (
          <NoOriginPanel
            onPickPoint={() => router.push('/destination')}
            onUseLocation={handleUseMyLocation}
          />
        )}

        {!trip && (
          <View style={{ gap: theme.spacing.sm }}>
            <Text style={{ ...theme.typography.smallStrong, color: theme.colors.textMuted }}>
              {copy.placesTitle}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
              {placeChips.map((poi) => (
                <Chip
                  key={poi.id}
                  label={poi.title}
                  onPress={() => router.push({ pathname: '/destination', params: { poi: poi.id } })}
                  testID={`place-chip-${poi.id}`}
                />
              ))}
            </View>
          </View>
        )}

        {networkStatus === 'offline' && (
          <Text style={{ ...theme.typography.small, color: theme.colors.infoInk }}>
            {copy.offlineNote}
          </Text>
        )}
      </ScrollView>

      <AccountSheet
        visible={accountVisible}
        onClose={() => setAccountVisible(false)}
        onLogout={() => logout.mutate()}
        loggingOut={logout.isPending}
        name={user ? `${user.first_name} ${user.last_name}`.trim() : undefined}
        onPrivacy={handleOpenPrivacy}
      />

      <Toast
        message={passengerCopy.activeTrip.ended}
        tone="info"
        visible={endedToast}
        onHide={() => setEndedToast(false)}
        testID="home-trip-ended-toast"
      />

      <LocationConsentSheet
        visible={noticeOpen}
        mode="consent"
        loading={grant.isPending}
        onContinue={handleAcceptNotice}
        onDismiss={handleDismissNotice}
      />
    </View>
  );
}

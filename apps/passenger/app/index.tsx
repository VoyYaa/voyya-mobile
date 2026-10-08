import React, { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
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
  uiCopy,
  useTheme,
} from '@voyyaa/ui-mobile';
import { LOCATION_NOTICE_VERSION } from '@voyyaa/shared';
import {
  confirmConsent,
  hasSeenLocalConsent,
  useLogout,
  useNetworkStatus,
  useSessionStore,
} from '@voyyaa/app-runtime';
import { CoverageBlockedPanel } from '../src/components/CoverageBlockedPanel';
import { InlineNotice } from '../src/components/InlineNotice';
import { LocatingPill } from '../src/components/LocatingPill';
import {
  LocationConsentSheet,
  type LocationConsentSheetMode,
} from '../src/components/LocationConsentSheet';
import { useCoverageGate } from '../src/hooks/useCoverageGate';
import { useResolveOrigin } from '../src/hooks/useResolveOrigin';
import { useTripDraftStore } from '../src/state/useTripDraftStore';
import { YARUMAL_CENTER } from '../src/constants/demo-places';
import { POIS_YARUMAL } from '../src/constants/pois-yarumal';
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
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const copy = passengerCopy.home;
  const networkStatus = useNetworkStatus();
  const user = useSessionStore((s) => s.user);
  const municipalityId = useTripDraftStore((s) => s.municipalityId);
  const origin = useTripDraftStore((s) => s.origin);
  const setOrigin = useTripDraftStore((s) => s.setOrigin);
  const clearOrigin = useTripDraftStore((s) => s.clearOrigin);
  const coverage = useCoverageGate(origin, municipalityId);
  const resolveOrigin = useResolveOrigin();
  const logout = useLogout();

  const [consentVisible, setConsentVisible] = useState(false);
  const [consentMode, setConsentMode] = useState<LocationConsentSheetMode>('consent');
  const [consentChecked, setConsentChecked] = useState(false);
  const [accountVisible, setAccountVisible] = useState(false);

  useEffect(() => {
    if (origin || consentChecked) return;
    void hasSeenLocalConsent('location', LOCATION_NOTICE_VERSION).then((seen) => {
      setConsentChecked(true);
      if (seen) {
        resolveOrigin.resolve();
      } else {
        setConsentMode('consent');
        setConsentVisible(true);
      }
    });
  }, [origin, consentChecked]);

  useEffect(() => {
    if (resolveOrigin.status === 'resolved' && resolveOrigin.origin) {
      setOrigin(resolveOrigin.origin, 'gps');
    }
  }, [resolveOrigin.status, resolveOrigin.origin, setOrigin]);

  const handleConsentContinue = (): void => {
    setConsentVisible(false);
    void confirmConsent('location', LOCATION_NOTICE_VERSION);
    resolveOrigin.resolve();
  };

  const handleConsentDismiss = (): void => {
    setConsentVisible(false);
  };

  const handleReviewPrivacy = (): void => {
    setAccountVisible(false);
    setConsentMode('review');
    setConsentVisible(true);
  };

  const handleChangeOrigin = (): void => {
    clearOrigin();
    router.push('/destination');
  };

  const handleUseMyLocation = (): void => {
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
  const showNoOrigin = !origin && !isResolving && consentChecked && !consentVisible;
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

        {origin && (
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

        {showNoOrigin && (
          <InlineNotice
            tone="brand"
            glyph="pin"
            title={copy.noOriginTitle}
            body={copy.noOriginBody}
            actionLabel={copy.useMyLocation}
            onAction={handleUseMyLocation}
            testID="home-no-origin"
          />
        )}

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
        onPrivacy={handleReviewPrivacy}
      />

      <LocationConsentSheet
        visible={consentVisible}
        mode={consentMode}
        onContinue={handleConsentContinue}
        onDismiss={handleConsentDismiss}
      />
    </View>
  );
}

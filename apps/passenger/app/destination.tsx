import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Linking, Pressable, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import {
  BrandSpinner,
  Button,
  LinkButton,
  Map,
  MarkGlyph,
  PointRoute,
  ScreenHeader,
  StatusBadge,
  TextField,
  useTheme,
  type MapLatLng,
} from '@voyyaa/ui-mobile';
import type { Location } from '@voyyaa/shared';
import { domainErrorCode, isNetworkError, useNetworkStatus } from '@voyyaa/app-runtime';
import { InlineNotice } from '../src/components/InlineNotice';
import { LocatingPill } from '../src/components/LocatingPill';
import { PlaceIcon } from '../src/components/PlaceIcon';
import { useKeyboardVisible } from '../src/hooks/useKeyboardVisible';
import { useQuoteFare } from '../src/hooks/useQuoteFare';
import { useResolveOrigin } from '../src/hooks/useResolveOrigin';
import { usePickupServiceOptions, useVerifyPickup } from '../src/hooks/useServiceOptions';
import { useTripDraftStore } from '../src/state/useTripDraftStore';
import { YARUMAL_CENTER } from '../src/constants/demo-places';
import { CAN_PIN_DROP } from '../src/constants/platform';
import { POIS_YARUMAL, type PoiYarumal } from '../src/constants/pois-yarumal';
import { passengerCopy } from '../src/copy/passenger-copy';

interface SelectedPlace {
  id: string;
  title: string;
  lat: number;
  lng: number;
}

const copy = passengerCopy.destination;
const PIN_DROP_ID = 'pin-drop';
const MAP_HEIGHT = 200;
const MAP_HEIGHT_COLLAPSED = 120;
const ROW_MIN_HEIGHT = 56;

function Chevron({ color }: { color: string }): React.JSX.Element {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
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

export default function DestinationScreen(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ poi?: string }>();
  const networkStatus = useNetworkStatus();
  const keyboardVisible = useKeyboardVisible();
  const quoteFare = useQuoteFare();
  const verifyPickup = useVerifyPickup();
  const { query: serviceOptions, municipalityId } = usePickupServiceOptions();
  const resolveOrigin = useResolveOrigin();

  const origin = useTripDraftStore((s) => s.origin);
  const originSource = useTripDraftStore((s) => s.originSource);
  const setOrigin = useTripDraftStore((s) => s.setOrigin);
  const clearOrigin = useTripDraftStore((s) => s.clearOrigin);
  const setOriginDestination = useTripDraftStore((s) => s.setOriginDestination);
  const setQuote = useTripDraftStore((s) => s.setQuote);

  const [query, setQuery] = useState('');
  const [coverageErrorId, setCoverageErrorId] = useState<string | null>(null);
  const [quotingId, setQuotingId] = useState<string | null>(null);
  const [pinCandidate, setPinCandidate] = useState<MapLatLng | null>(null);
  const [originPinCandidate, setOriginPinCandidate] = useState<MapLatLng | null>(null);
  const [originCoverageBlocked, setOriginCoverageBlocked] = useState(false);
  const appliedPoi = useRef(false);

  const isFixingOrigin = origin === null;
  const offline = networkStatus === 'offline';
  const optionsPending = !isFixingOrigin && serviceOptions.isPending && !offline;
  const busy = quoteFare.isPending || verifyPickup.isPending || optionsPending;

  const visiblePois = useMemo(() => {
    const text = query.trim().toLowerCase();
    if (!text) return POIS_YARUMAL;
    return POIS_YARUMAL.filter((poi) => poi.title.toLowerCase().includes(text));
  }, [query]);

  useEffect(() => {
    if (resolveOrigin.status === 'resolved' && resolveOrigin.origin) {
      setOrigin(resolveOrigin.origin, 'gps');
    }
  }, [resolveOrigin.status, resolveOrigin.origin, setOrigin]);

  const selectPlace = (place: SelectedPlace): void => {
    if (!origin || municipalityId === null) return;
    setCoverageErrorId(null);
    setQuotingId(place.id);
    const destination: Location = { address: place.title, lat: place.lat, lng: place.lng };
    quoteFare.mutate(
      { origin, destination, municipality_id: municipalityId, service_type: 'taxi' },
      {
        onSuccess: (quote) => {
          setOriginDestination(origin, destination);
          setQuote(quote);
          router.push('/confirm');
        },
        onError: (error) => {
          if (domainErrorCode(error) === 'OUT_OF_COVERAGE') {
            setCoverageErrorId(place.id);
          }
        },
        onSettled: () => setQuotingId(null),
      },
    );
  };

  const selectPoi = (poi: PoiYarumal): void => {
    if (!poi.coord) return;
    selectPlace({ id: poi.id, title: poi.title, lat: poi.coord.lat, lng: poi.coord.lng });
  };

  useEffect(() => {
    if (appliedPoi.current || !params.poi || !origin) return;
    const poi = POIS_YARUMAL.find((candidate) => candidate.id === params.poi);
    appliedPoi.current = true;
    if (!poi) return;
    if (poi.coord) selectPoi(poi);
    else setQuery(poi.title);
  }, [params.poi, origin]);

  const confirmPin = (): void => {
    if (!pinCandidate) return;
    selectPlace({
      id: PIN_DROP_ID,
      title: copy.pinPoint,
      lat: pinCandidate.lat,
      lng: pinCandidate.lng,
    });
  };

  const verifyOrigin = (candidate: Location): void => {
    setOriginCoverageBlocked(false);
    verifyPickup.mutate(candidate, {
      onSuccess: (options) => {
        if (options.municipality === null) {
          setOriginCoverageBlocked(true);
          return;
        }
        setOrigin(candidate, 'manual');
      },
    });
  };

  const confirmOriginPin = (): void => {
    if (!originPinCandidate) return;
    verifyOrigin({
      address: copy.pinPoint,
      lat: originPinCandidate.lat,
      lng: originPinCandidate.lng,
    });
  };

  const selectOriginPoi = (poi: PoiYarumal): void => {
    if (!poi.coord) return;
    verifyOrigin({ address: poi.title, lat: poi.coord.lat, lng: poi.coord.lng });
  };

  const retryUseMyLocation = (): void => {
    if (!resolveOrigin.canAskAgain) {
      void Linking.openSettings();
      return;
    }
    resolveOrigin.resolve();
  };

  const errorCode = domainErrorCode(quoteFare.error);
  const hasGenericError =
    quoteFare.isError && !isNetworkError(quoteFare.error) && errorCode !== 'OUT_OF_COVERAGE';
  const hasVerifyError = verifyPickup.isError && !isNetworkError(verifyPickup.error);
  const hasOptionsError = !isFixingOrigin && serviceOptions.isError && !offline;
  const originOutOfCoverage = !isFixingOrigin && serviceOptions.data?.municipality === null;
  const stickyPin = isFixingOrigin ? originPinCandidate : pinCandidate;

  const header = (
    <View style={{ gap: theme.spacing.md, paddingBottom: theme.spacing.md }}>
      {isFixingOrigin ? (
        <View style={{ gap: theme.spacing.xs }}>
          <Text style={{ ...theme.typography.subtitle, color: theme.colors.text }}>
            {copy.noOriginTitle}
          </Text>
          <Text style={{ ...theme.typography.small, color: theme.colors.textMuted }}>
            {copy.noOriginBody}
          </Text>
          {resolveOrigin.status === 'resolving' ? (
            <LocatingPill />
          ) : (
            <LinkButton
              label={copy.useMyLocation}
              onPress={retryUseMyLocation}
              testID="use-my-location-link"
            />
          )}
        </View>
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
          <View style={{ flex: 1 }}>
            <PointRoute
              origin={{ label: copy.originLabel, value: origin.address }}
              destination={{
                label: copy.destinationLabel,
                value: query || copy.destinationPlaceholder,
              }}
            />
          </View>
          {originSource === 'manual' && (
            <LinkButton
              label={copy.changeOrigin}
              onPress={clearOrigin}
              testID="change-origin-link"
            />
          )}
        </View>
      )}

      {CAN_PIN_DROP && (
        <Map
          pinDrop
          center={
            isFixingOrigin
              ? (originPinCandidate ?? YARUMAL_CENTER)
              : { lat: origin.lat, lng: origin.lng }
          }
          markers={
            isFixingOrigin
              ? []
              : [
                  {
                    id: 'origin',
                    kind: 'origin',
                    coord: { lat: origin.lat, lng: origin.lng },
                    label: origin.address,
                  },
                ]
          }
          onPickLocation={isFixingOrigin ? setOriginPinCandidate : setPinCandidate}
          height={keyboardVisible ? MAP_HEIGHT_COLLAPSED : MAP_HEIGHT}
        />
      )}

      {originOutOfCoverage && (
        <InlineNotice
          tone="danger"
          glyph="pin"
          title={copy.outOfCoverageTitle}
          body={copy.outOfCoverage('origin')}
          testID="destination-origin-out-of-coverage"
        />
      )}

      {isFixingOrigin && originCoverageBlocked && (
        <InlineNotice
          tone="danger"
          glyph="pin"
          title={copy.outOfCoverageTitle}
          body={copy.outOfCoverage('origin')}
          testID="origin-out-of-coverage"
        />
      )}

      {!isFixingOrigin && coverageErrorId === PIN_DROP_ID && (
        <InlineNotice
          tone="danger"
          glyph="pin"
          title={copy.outOfCoverageTitle}
          body={copy.outOfCoverage('destination')}
          testID="pin-out-of-coverage"
        />
      )}

      {!isFixingOrigin && (
        <TextField
          label={copy.searchLabel}
          value={query}
          onChangeText={setQuery}
          placeholder={copy.searchPlaceholder}
          returnKeyType="search"
          testID="destination-search"
        />
      )}

      {offline && (
        <InlineNotice
          tone="info"
          glyph="offline"
          title={copy.offlineQuote}
          testID="destination-offline"
        />
      )}

      {(hasVerifyError || hasOptionsError) && (
        <InlineNotice
          tone="danger"
          glyph="error"
          title={copy.serviceOptionsErrorTitle}
          body={copy.serviceOptionsErrorBody}
          actionLabel={copy.retry}
          onAction={() => (hasVerifyError ? verifyPickup.reset() : void serviceOptions.refetch())}
          testID="destination-options-error"
        />
      )}

      {hasGenericError && (
        <InlineNotice
          tone="danger"
          glyph="error"
          title={copy.quoteErrorTitle}
          body={copy.quoteErrorBody}
          actionLabel={copy.retry}
          onAction={() => quoteFare.reset()}
          testID="destination-quote-error"
        />
      )}

      <Text style={{ ...theme.typography.smallStrong, color: theme.colors.textMuted }}>
        {copy.placesTitle}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <ScreenHeader title={copy.header} onBack={() => router.back()} />
      <FlatList
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: theme.spacing.lg }}
        data={visiblePois}
        keyExtractor={(poi) => poi.id}
        ListHeaderComponent={header}
        ItemSeparatorComponent={() => <View style={{ height: theme.spacing.sm }} />}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', gap: theme.spacing.sm, padding: theme.spacing.xl }}>
            <MarkGlyph glyph="search" size={64} />
            <Text
              style={{
                ...theme.typography.bodyStrong,
                color: theme.colors.text,
                textAlign: 'center',
              }}
            >
              {copy.emptyTitle}
            </Text>
            <Text
              style={{
                ...theme.typography.body,
                color: theme.colors.textMuted,
                textAlign: 'center',
              }}
            >
              {copy.emptyBody}
            </Text>
          </View>
        }
        renderItem={({ item: poi }) => (
          <View>
            <Pressable
              disabled={!poi.coord || offline || busy}
              onPress={() => (isFixingOrigin ? selectOriginPoi(poi) : selectPoi(poi))}
              accessibilityRole="button"
              accessibilityLabel={poi.coord ? poi.title : copy.pendingLabel(poi.title)}
              accessibilityState={{
                disabled: !poi.coord || offline || busy,
                busy: quotingId === poi.id,
              }}
              testID={`poi-row-${poi.id}`}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                minHeight: ROW_MIN_HEIGHT,
                gap: theme.spacing.md,
                padding: theme.spacing.sm,
                borderRadius: theme.radius.card,
                borderWidth: coverageErrorId === poi.id ? 2 : 1,
                borderColor: coverageErrorId === poi.id ? theme.colors.danger : theme.colors.border,
                backgroundColor: pressed ? theme.colors.brandTint : theme.colors.surface,
                opacity: poi.coord ? 1 : 0.7,
              })}
            >
              <PlaceIcon category={poi.category} />
              <View style={{ flex: 1 }}>
                <Text style={{ ...theme.typography.bodyStrong, color: theme.colors.text }}>
                  {poi.title}
                </Text>
                {!poi.coord && (
                  <Text style={{ ...theme.typography.small, color: theme.colors.textMuted }}>
                    {copy.pendingLocation}
                  </Text>
                )}
              </View>
              {quotingId === poi.id ? (
                <BrandSpinner size={24} />
              ) : !poi.coord ? (
                <StatusBadge label={copy.pendingBadge} tone="warn" />
              ) : (
                <Chevron color={theme.colors.textMuted} />
              )}
            </Pressable>
            {coverageErrorId === poi.id && (
              <View style={{ marginTop: theme.spacing.sm }}>
                <InlineNotice
                  tone="danger"
                  glyph="pin"
                  title={copy.outOfCoverageTitle}
                  body={copy.outOfCoverage('destination')}
                />
              </View>
            )}
          </View>
        )}
      />

      {stickyPin && (
        <View
          style={{
            padding: theme.spacing.lg,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
            backgroundColor: theme.colors.bg,
          }}
        >
          <Button
            label={isFixingOrigin ? copy.useAsOrigin : copy.useAsDestination}
            size="lg"
            loading={isFixingOrigin ? verifyPickup.isPending : quoteFare.isPending}
            loadingLabel={isFixingOrigin ? copy.verifying : copy.quoting}
            disabled={offline}
            onPress={isFixingOrigin ? confirmOriginPin : confirmPin}
            testID="use-pin-button"
          />
        </View>
      )}
    </SafeAreaView>
  );
}

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BrandLoader,
  Button,
  Reveal,
  Stage,
  StatePanel,
  Toast,
  formatMMSS,
  uiCopy,
  useReducedMotion,
  useTheme,
} from '@voyyaa/ui-mobile';
import type { PassengerUiState } from '@voyyaa/shared';
import { useNetworkStatus } from '@voyyaa/app-runtime';
import { CrossFadeText } from '../src/components/CrossFadeText';
import { SearchRadar } from '../src/components/SearchRadar';
import { StageTicket } from '../src/components/StageTicket';
import { useTripRequestStatus } from '../src/hooks/useTripRequestStatus';
import { useCancelTripRequest } from '../src/hooks/useCancelTripRequest';
import { useQuoteFare } from '../src/hooks/useQuoteFare';
import { useCreateTripRequest } from '../src/hooks/useCreateTripRequest';
import { useTripDraftStore } from '../src/state/useTripDraftStore';
import { PROLONGED_SEARCH_THRESHOLD_SEC } from '../src/constants/parameters';
import { MATCH_TIMING } from '../src/constants/search-timing';
import { passengerCopy } from '../src/copy/passenger-copy';

const copy = passengerCopy.searching;

const SEARCHING_UI: readonly PassengerUiState[] = ['searching', 'calculating_fare'];
const DRIVER_UI: readonly PassengerUiState[] = [
  'driver_assigned',
  'driver_en_route',
  'driver_waiting',
  'trip_in_progress',
];

const RADAR_MAX_SIZE = 300;
const RADAR_MIN_SIZE = 180;
const RADAR_HEIGHT_RATIO = 0.34;

function ElapsedCounter({ resetKey }: { resetKey: number | null }): React.JSX.Element {
  const theme = useTheme();
  const [elapsedSec, setElapsedSec] = useState(0);

  useEffect(() => {
    const startedAt = Date.now();
    setElapsedSec(0);
    const interval = setInterval(
      () => setElapsedSec(Math.floor((Date.now() - startedAt) / 1000)),
      1000,
    );
    return () => clearInterval(interval);
  }, [resetKey]);

  return (
    <Text
      testID="search-elapsed"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        ...theme.typography.small,
        color: theme.colors.onStageMuted,
        fontVariant: ['tabular-nums'],
      }}
    >
      {copy.elapsed(formatMMSS(elapsedSec))}
    </Text>
  );
}

export default function SearchingScreen(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const reduced = useReducedMotion();
  const params = useLocalSearchParams<{ id: string }>();
  const tripRequestId = params.id ? Number(params.id) : null;
  const networkStatus = useNetworkStatus();

  const { data, isError, refetch } = useTripRequestStatus(tripRequestId);

  const origin = useTripDraftStore((s) => s.origin);
  const destination = useTripDraftStore((s) => s.destination);
  const serviceType = useTripDraftStore((s) => s.serviceType);
  const municipalityId = useTripDraftStore((s) => s.municipalityId);
  const resetDraft = useTripDraftStore((s) => s.reset);
  const quote = useTripDraftStore((s) => s.quote);
  const setActiveTripRequestId = useTripDraftStore((s) => s.setActiveTripRequestId);

  const cancelTripRequest = useCancelTripRequest(tripRequestId);
  const quoteFare = useQuoteFare();
  const createTripRequest = useCreateTripRequest();

  const [prolongedSearch, setProlongedSearch] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [matched, setMatched] = useState(false);
  const [matchedCaption, setMatchedCaption] = useState(false);
  const sawSearching = useRef(false);
  const navigated = useRef(false);

  const goToTrip = useCallback((): void => {
    if (navigated.current || !tripRequestId) return;
    navigated.current = true;
    router.replace({ pathname: '/driver-assigned', params: { id: String(tripRequestId) } });
  }, [router, tripRequestId]);

  useEffect(() => {
    setProlongedSearch(false);
    const timer = setTimeout(() => setProlongedSearch(true), PROLONGED_SEARCH_THRESHOLD_SEC * 1000);
    return () => clearTimeout(timer);
  }, [tripRequestId]);

  useEffect(() => {
    if (!data || !tripRequestId) return;
    if (SEARCHING_UI.includes(data.ui)) {
      sawSearching.current = true;
      return;
    }
    if (!DRIVER_UI.includes(data.ui)) return;
    if (sawSearching.current) setMatched(true);
    else goToTrip();
  }, [data?.ui, tripRequestId, goToTrip]);

  useEffect(() => {
    if (!matched) return;
    if (reduced) {
      setMatchedCaption(true);
      return;
    }
    const timer = setTimeout(() => setMatchedCaption(true), MATCH_TIMING.captionSwapMs);
    return () => clearTimeout(timer);
  }, [matched, reduced]);

  if (!tripRequestId) {
    return (
      <Stage style={{ flex: 1 }} topInset={insets.top}>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <StatePanel
            tone="onStage"
            glyph="error"
            accessibilityRole="alert"
            title={copy.notFoundTitle}
            primaryAction={{ label: copy.backHome, onPress: () => router.replace('/') }}
          />
        </View>
      </Stage>
    );
  }

  const cancelWithoutConfirm = (): void => {
    cancelTripRequest.mutate(undefined, {
      onSuccess: () => {
        setToastVisible(true);
        resetDraft();
        setTimeout(() => router.replace('/'), 900);
      },
    });
  };

  const retrySearch = (): void => {
    if (!origin || !destination) {
      router.replace('/');
      return;
    }
    createTripRequest.reset();
    quoteFare.mutate(
      { origin, destination, municipality_id: municipalityId, service_type: serviceType },
      {
        onSuccess: (freshQuote) => {
          createTripRequest.mutate(
            {
              origin,
              destination,
              municipality_id: municipalityId,
              service_type: serviceType,
              payment_method: 'cash',
              quote_token: freshQuote.quote_token,
            },
            {
              onSuccess: (newTripRequest) => {
                setActiveTripRequestId(newTripRequest.trip_request_id);
                router.replace({
                  pathname: '/searching',
                  params: { id: String(newTripRequest.trip_request_id) },
                });
              },
            },
          );
        },
      },
    );
  };

  const goBackHome = (): void => {
    resetDraft();
    router.replace('/');
  };

  const retrying = quoteFare.isPending || createTripRequest.isPending;
  const retryFailed = quoteFare.isError || createTripRequest.isError;

  if (isError && !data) {
    const offline = networkStatus === 'offline';
    return (
      <Stage style={{ flex: 1 }} topInset={insets.top}>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <StatePanel
            tone="onStage"
            glyph={offline ? 'offline' : 'error'}
            accessibilityRole="alert"
            title={offline ? uiCopy.offlineTitle : copy.statusErrorTitle}
            body={offline ? uiCopy.offlineBody : undefined}
            primaryAction={{ label: uiCopy.retry, onPress: () => refetch() }}
          />
        </View>
      </Stage>
    );
  }

  if (data?.ui === 'no_driver') {
    return (
      <Stage style={{ flex: 1 }} topInset={insets.top}>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <Reveal>
            {retryFailed && !retrying ? (
              <StatePanel
                tone="onStage"
                glyph="error"
                accessibilityRole="alert"
                title={copy.retryFailedTitle}
                body={copy.retryFailedBody}
                primaryAction={{ label: uiCopy.retry, onPress: retrySearch }}
                secondaryAction={{ label: copy.backHome, onPress: goBackHome }}
              />
            ) : (
              <StatePanel
                tone="onStage"
                glyph="clock"
                title={copy.noDriverTitle}
                body={copy.noDriverBody}
                primaryAction={{ label: copy.retry, onPress: retrySearch }}
                secondaryAction={{ label: copy.backHome, onPress: goBackHome }}
                testID="search-no-driver"
              />
            )}
          </Reveal>
        </View>
        {retrying && (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
            <BrandLoader variant="overlay" size="md" />
          </View>
        )}
      </Stage>
    );
  }

  const radarSize = Math.round(
    Math.min(RADAR_MAX_SIZE, Math.max(RADAR_MIN_SIZE, windowHeight * RADAR_HEIGHT_RATIO)),
  );
  const degraded = networkStatus === 'offline' || (isError && Boolean(data));
  const fareTotal = data?.fare.total ?? quote?.fare.total ?? null;
  const bodyIndex = matchedCaption ? 2 : prolongedSearch ? 1 : 0;

  return (
    <View
      style={{ flex: 1 }}
      onTouchStart={() => {
        if (matched) goToTrip();
      }}
    >
      <Stage style={{ flex: 1 }} topInset={insets.top} testID="searching-stage">
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            paddingHorizontal: theme.spacing.gutter,
            paddingTop: theme.spacing.md,
            paddingBottom: Math.max(insets.bottom, theme.spacing.xl),
            gap: theme.spacing.md,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: theme.colors.success,
              }}
            />
            <Text style={{ ...theme.typography.eyebrow, color: theme.colors.brand }}>
              {copy.eyebrow}
            </Text>
          </View>

          <View style={{ flex: 1, justifyContent: 'center' }}>
            <SearchRadar
              size={radarSize}
              matched={matched}
              prolonged={prolongedSearch}
              degraded={degraded}
              onMatchedDone={goToTrip}
            />
          </View>

          <View style={{ alignSelf: 'stretch', alignItems: 'center', gap: theme.spacing.xs }}>
            <CrossFadeText
              lines={[copy.title, copy.matchedTitle]}
              activeIndex={matchedCaption ? 1 : 0}
              accessibilityRole="header"
              style={{
                ...theme.typography.display,
                fontSize: 30,
                lineHeight: 34,
                color: theme.colors.onStage,
                textAlign: 'center',
              }}
              testID="search-title"
            />
            <ElapsedCounter resetKey={tripRequestId} />
            <CrossFadeText
              lines={[copy.body, copy.prolongedBody, copy.matchedBody]}
              activeIndex={bodyIndex}
              reservedLines={2}
              announceFromIndex={1}
              style={{
                ...theme.typography.body,
                color: theme.colors.onStageMuted,
                textAlign: 'center',
              }}
              testID="search-body"
            />
          </View>

          {origin && destination && fareTotal !== null && (
            <StageTicket
              originAddress={origin.address}
              destinationAddress={destination.address}
              total={fareTotal}
            />
          )}

          <View style={{ alignSelf: 'stretch' }}>
            <Button
              label={copy.cancel}
              variant="ghostOnStage"
              loading={cancelTripRequest.isPending}
              loadingLabel={copy.cancelling}
              disabled={networkStatus === 'offline' || matched}
              accessibilityHint={networkStatus === 'offline' ? copy.cancelOfflineHint : undefined}
              onPress={cancelWithoutConfirm}
              testID="cancel-search-button"
            />
          </View>
        </View>
      </Stage>

      <Toast
        message={copy.cancelled}
        tone="neutral"
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
      />
    </View>
  );
}

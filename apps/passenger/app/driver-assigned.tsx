import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  BrandLoader,
  ErrorState,
  OfflineState,
  ScreenHeader,
  Toast,
  useDelayedLoading,
  useTheme,
} from '@voyyaa/ui-mobile';
import type { PassengerUiState } from '@voyyaa/shared';
import { useNetworkStatus, useSessionStore } from '@voyyaa/app-runtime';
import { ActiveTripView } from '../src/components/ActiveTripView';
import { BranchFade } from '../src/components/BranchFade';
import { CancelConfirmSheet } from '../src/components/CancelConfirmSheet';
import { SavedTripView } from '../src/components/SavedTripView';
import { TripOutcomeView, type TripOutcomeKind } from '../src/components/TripOutcomeView';
import type { TripStep } from '../src/components/TripStepRail';
import { useActiveTripCache } from '../src/hooks/useActiveTrip';
import { useTripRequestStatus } from '../src/hooks/useTripRequestStatus';
import { useLastAttemptFailed } from '../src/hooks/useLastAttemptFailed';
import { usePickupOriginPersistence } from '../src/hooks/usePickupOriginPersistence';
import { usePersistStartCode, useRestoredStartCode } from '../src/hooks/useStartCodePersistence';
import { useCancelTripRequest } from '../src/hooks/useCancelTripRequest';
import { useFreeCancellation } from '../src/hooks/useFreeCancellation';
import { useTripTransitionNotice } from '../src/hooks/useTripTransitionNotice';
import { useTripDraftStore } from '../src/state/useTripDraftStore';
import { useTripTransitionStore } from '../src/state/useTripTransitionStore';
import { TRIP_NOT_FOUND_NOTICE } from '../src/constants/notices';
import { RETRY_FEEDBACK_MIN_MS } from '../src/constants/parameters';
import { SAVED_TRIP_SOURCE_PARAM, SAVED_TRIP_SOURCE_VALUE } from '../src/constants/route-params';
import { isNotOwnedOrMissing } from '../src/lib/notification-target';
import {
  modeEntryAnnouncement,
  retryFeedbackRemainingMs,
  type SavedTripMode,
} from '../src/lib/saved-trip-mode';
import { isSessionFresh } from '../src/lib/session-freshness';
import { startCodeRecordStore } from '../src/lib/start-code-runtime';
import { codeChangedAfterRestore } from '../src/lib/start-code-view';
import { canRestorePickup, tripScreenMode } from '../src/lib/trip-screen-mode';
import { passengerCopy } from '../src/copy/passenger-copy';

const copy = passengerCopy.trip;
const savedCopy = passengerCopy.savedTrip;
const savedCodeCopy = passengerCopy.startCode.saved;

const SEARCH_UI: readonly PassengerUiState[] = ['searching', 'calculating_fare', 'no_driver'];

const STEP_BY_UI: Partial<Record<PassengerUiState, TripStep>> = {
  driver_assigned: 0,
  driver_en_route: 1,
  driver_waiting: 2,
  trip_in_progress: 3,
};

function outcomeKindOf(ui: PassengerUiState, status: string): TripOutcomeKind | null {
  if (ui === 'trip_completed') return 'completed';
  if (ui === 'trip_no_show') return 'no_show';
  if (ui === 'trip_cancelled') {
    return status === 'cancelled_by_driver' ? 'cancelled_by_driver' : 'cancelled_by_you';
  }
  return null;
}

export default function DriverAssignedScreen(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; source?: string }>();
  const tripRequestId = params.id ? Number(params.id) : null;
  const enteredFromSaved = params[SAVED_TRIP_SOURCE_PARAM] === SAVED_TRIP_SOURCE_VALUE;
  const networkStatus = useNetworkStatus();
  const offline = networkStatus === 'offline';
  const sessionStartedAt = useSessionStore((s) => s.sessionStartedAt);

  const query = useTripRequestStatus(tripRequestId);
  const { isError, error, dataUpdatedAt, refetch } = query;
  const hasFreshData = query.data !== undefined && isSessionFresh(dataUpdatedAt, sessionStartedAt);
  const data = hasFreshData ? query.data : undefined;
  const lastAttemptFailed = useLastAttemptFailed(isError, offline);
  const restoredRecord = useRestoredStartCode(tripRequestId);
  const [retrying, setRetrying] = useState(false);

  const mode = tripScreenMode({
    hasFreshData,
    isError,
    notOwnedOrMissing: isError && isNotOwnedOrMissing(error),
    offline,
    retrying,
    lastAttemptFailed,
    restoredRecord,
    enteredFromSaved,
  });
  const showLoader = useDelayedLoading(mode.kind === 'loading');

  usePersistStartCode(query.data, dataUpdatedAt);
  useTripTransitionNotice(data);
  usePickupOriginPersistence(
    tripRequestId,
    canRestorePickup({ restoredRecord, tripRequestId, hasFreshData }),
  );

  const origin = useTripDraftStore((s) => s.origin);
  const destination = useTripDraftStore((s) => s.destination);
  const resetDraft = useTripDraftStore((s) => s.reset);
  const seedAssigned = useTripTransitionStore((s) => s.seedAssigned);
  const activeTripCache = useActiveTripCache();
  const cancelTripRequest = useCancelTripRequest(tripRequestId);

  const [sheetVisible, setSheetVisible] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'neutral' } | null>(null);

  const offlineRef = useRef(offline);
  offlineRef.current = offline;
  const shownRestoredCode = useRef<string | null>(null);
  if (mode.kind === 'restored') shownRestoredCode.current = mode.record.start_code;
  const initialCodeChanged =
    data !== undefined && codeChangedAfterRestore(shownRestoredCode.current, data);

  useEffect(() => {
    if (data && tripRequestId && SEARCH_UI.includes(data.ui)) {
      router.replace({ pathname: '/searching', params: { id: String(tripRequestId) } });
    }
  }, [data?.ui, tripRequestId, router]);

  useEffect(() => {
    if (mode.kind !== 'not_found') return;
    void startCodeRecordStore.clear();
    resetDraft();
    router.replace({ pathname: '/', params: { notice: TRIP_NOT_FOUND_NOTICE } });
  }, [mode.kind]);

  const restoredNow = mode.kind === 'restored';
  useEffect(() => {
    if (restoredNow && tripRequestId !== null) seedAssigned(tripRequestId);
  }, [restoredNow, tripRequestId, seedAssigned]);

  const savedNote: SavedTripMode | null = mode.kind === 'restored' ? mode.note : null;
  const previousNote = useRef<SavedTripMode | null>(null);
  useEffect(() => {
    const announcement =
      savedNote === null ? null : modeEntryAnnouncement(previousNote.current, savedNote);
    previousNote.current = savedNote;
    if (announcement === 'offline') {
      AccessibilityInfo.announceForAccessibility(savedCodeCopy.offlineTitle);
    }
    if (announcement === 'error') {
      AccessibilityInfo.announceForAccessibility(savedCodeCopy.errorTitle);
    }
  }, [savedNote]);

  const wasRestored = useRef(false);
  useEffect(() => {
    if (mode.kind === 'restored') {
      wasRestored.current = true;
      return;
    }
    if (mode.kind !== 'server' || !wasRestored.current) return;
    wasRestored.current = false;
    if (data?.start_code_state === 'active' && !initialCodeChanged) {
      AccessibilityInfo.announceForAccessibility(savedCopy.announce.refreshed);
    }
  }, [mode.kind]);

  const { remainingSec, withinWindow } = useFreeCancellation(data, dataUpdatedAt);

  const goHome = (): void => {
    activeTripCache.clear();
    void startCodeRecordStore.clear();
    resetDraft();
    router.replace('/');
  };

  const confirmCancellation = (): void => {
    cancelTripRequest.mutate(undefined, {
      onSuccess: (result) => {
        setSheetVisible(false);
        setToast({
          message: result.free_of_charge ? copy.cancelledFree : copy.cancelledRecorded,
          tone: result.free_of_charge ? 'success' : 'neutral',
        });
        resetDraft();
        setTimeout(() => router.replace('/'), 1000);
      },
    });
  };

  const retrySavedTrip = (): void => {
    if (retrying) return;
    const startedAt = Date.now();
    setRetrying(true);
    void refetch().then((result) => {
      const finish = (): void => {
        setRetrying(false);
        if (!result.isError) return;
        AccessibilityInfo.announceForAccessibility(
          offlineRef.current ? savedCopy.announce.stillOffline : savedCopy.announce.stillFailing,
        );
      };
      setTimeout(finish, retryFeedbackRemainingMs(Date.now() - startedAt, RETRY_FEEDBACK_MIN_MS));
    });
  };

  if (!tripRequestId) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
        <ErrorState
          title={copy.notFoundTitle}
          onRetry={() => router.replace('/')}
          retryLabel={copy.backHome}
        />
      </SafeAreaView>
    );
  }

  if (mode.kind === 'not_found') {
    return <View style={{ flex: 1, backgroundColor: theme.colors.bg }} testID="trip-not-found" />;
  }

  if (mode.kind === 'empty') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
        <ScreenHeader title={copy.header} />
        {mode.reason === 'offline' ? (
          <OfflineState onRetry={() => refetch()} />
        ) : (
          <ErrorState title={copy.statusErrorTitle} onRetry={() => refetch()} />
        )}
      </SafeAreaView>
    );
  }

  if (mode.kind === 'loading' || (mode.kind === 'server' && data === undefined)) {
    return (
      <View style={{ flex: 1, backgroundColor: showLoader ? theme.colors.stage : theme.colors.bg }}>
        {showLoader && <BrandLoader variant="screen" label={copy.loading} />}
      </View>
    );
  }

  const outcome = data ? outcomeKindOf(data.ui, data.status) : null;
  const step: TripStep = (data && STEP_BY_UI[data.ui]) ?? 1;
  const branch = mode.kind === 'restored' ? 'saved' : (outcome ?? 'active');

  let body: React.JSX.Element | null = null;
  if (mode.kind === 'restored') {
    body = (
      <SavedTripView
        mode={mode.note}
        code={mode.record.start_code}
        savedAt={mode.record.saved_at}
        pickupAddress={origin?.address ?? null}
        retrying={retrying}
        onRetry={retrySavedTrip}
      />
    );
  } else if (data && outcome) {
    body = <TripOutcomeView kind={outcome} total={data.fare.total} onHome={goHome} />;
  } else if (data) {
    body = (
      <ActiveTripView
        data={data}
        step={step}
        origin={origin}
        destination={destination}
        withinWindow={withinWindow}
        remainingSec={remainingSec}
        dataUpdatedAt={dataUpdatedAt}
        isStale={isError}
        offline={offline}
        initialCodeChanged={initialCodeChanged}
        onCancel={() => setSheetVisible(true)}
        onRefresh={() => refetch()}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <BranchFade branchKey={branch}>{body}</BranchFade>

      <CancelConfirmSheet
        visible={sheetVisible}
        withinWindow={withinWindow}
        startBlocked={data?.start_code_state === 'blocked'}
        loading={cancelTripRequest.isPending}
        onConfirmCancel={confirmCancellation}
        onKeepWaiting={() => setSheetVisible(false)}
      />

      <Toast
        message={toast?.message ?? ''}
        tone={toast?.tone ?? 'neutral'}
        visible={toast !== null}
        onHide={() => setToast(null)}
      />
    </View>
  );
}

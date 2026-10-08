import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
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
import { useNetworkStatus } from '@voyyaa/app-runtime';
import { ActiveTripView } from '../src/components/ActiveTripView';
import { BranchFade } from '../src/components/BranchFade';
import { CancelConfirmSheet } from '../src/components/CancelConfirmSheet';
import { TripOutcomeView, type TripOutcomeKind } from '../src/components/TripOutcomeView';
import type { TripStep } from '../src/components/TripStepRail';
import { useActiveTripCache } from '../src/hooks/useActiveTrip';
import { useTripRequestStatus } from '../src/hooks/useTripRequestStatus';
import { useCancelTripRequest } from '../src/hooks/useCancelTripRequest';
import { useFreeCancellation } from '../src/hooks/useFreeCancellation';
import { useTripDraftStore } from '../src/state/useTripDraftStore';
import { passengerCopy } from '../src/copy/passenger-copy';

const copy = passengerCopy.trip;

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
  const params = useLocalSearchParams<{ id: string }>();
  const tripRequestId = params.id ? Number(params.id) : null;
  const networkStatus = useNetworkStatus();

  const { data, isLoading, isError, dataUpdatedAt, refetch } = useTripRequestStatus(tripRequestId);
  const showLoader = useDelayedLoading(isLoading);

  const origin = useTripDraftStore((s) => s.origin);
  const destination = useTripDraftStore((s) => s.destination);
  const resetDraft = useTripDraftStore((s) => s.reset);
  const activeTripCache = useActiveTripCache();
  const cancelTripRequest = useCancelTripRequest(tripRequestId);

  const [sheetVisible, setSheetVisible] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'neutral' } | null>(null);

  useEffect(() => {
    if (data && tripRequestId && SEARCH_UI.includes(data.ui)) {
      router.replace({ pathname: '/searching', params: { id: String(tripRequestId) } });
    }
  }, [data?.ui, tripRequestId, router]);

  const { remainingSec, withinWindow } = useFreeCancellation(data, dataUpdatedAt);

  const goHome = (): void => {
    activeTripCache.clear();
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

  const offline = networkStatus === 'offline';

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

  if (!data && (isError || offline)) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
        <ScreenHeader title={copy.header} />
        {offline ? (
          <OfflineState onRetry={() => refetch()} />
        ) : (
          <ErrorState title={copy.statusErrorTitle} onRetry={() => refetch()} />
        )}
      </SafeAreaView>
    );
  }

  if (isLoading || !data) {
    return (
      <View style={{ flex: 1, backgroundColor: showLoader ? theme.colors.stage : theme.colors.bg }}>
        {showLoader && <BrandLoader variant="screen" label={copy.loading} />}
      </View>
    );
  }

  const outcome = outcomeKindOf(data.ui, data.status);
  const step: TripStep = STEP_BY_UI[data.ui] ?? 1;
  const branch = outcome ?? 'active';

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <BranchFade branchKey={branch}>
        {outcome ? (
          <TripOutcomeView kind={outcome} total={data.fare.total} onHome={goHome} />
        ) : (
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
            onCancel={() => setSheetVisible(true)}
          />
        )}
      </BranchFade>

      <CancelConfirmSheet
        visible={sheetVisible}
        withinWindow={withinWindow}
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

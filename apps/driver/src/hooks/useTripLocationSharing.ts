import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useQueryClient } from '@tanstack/react-query';
import { isNetworkError } from '@voyyaa/app-runtime';
import { getDriverHome } from '../api/driver.api';
import { remainingCapMs } from '../tracking/sharing-machine';
import { readLocationAccuracy } from '../tracking/location-service';
import {
  dispatchSharing,
  setSharingEnvironment,
  useSharingStore,
} from '../tracking/sharing-runtime';
import { DRIVER_HOME_QUERY_KEY, useDriverHome } from './useDriverHome';
import { useIsAuthenticated } from './useIsAuthenticated';

const CAP_GRACE_MS = 50;

async function refreshEnvironment(): Promise<void> {
  const [accuracy, permission] = await Promise.all([
    readLocationAccuracy(),
    Notifications.getPermissionsAsync().catch(() => null),
  ]);
  setSharingEnvironment({
    accuracy,
    notificationsGranted: permission === null ? null : permission.granted,
  });
}

export function useTripLocationSharing(): void {
  const authenticated = useIsAuthenticated();
  const home = useDriverHome();
  const refetchHome = home.refetch;
  const machine = useSharingStore((s) => s.machine);
  const activeTrip = home.data?.active_trip ?? null;
  const sharing = activeTrip?.location_sharing ?? null;
  const tripStatus = activeTrip?.status ?? null;

  useEffect(() => {
    if (!home.isSuccess) return;
    let cancelled = false;
    void readLocationAccuracy().then((accuracy) => {
      if (cancelled) return;
      setSharingEnvironment({ accuracy });
      dispatchSharing({
        type: 'home',
        now: Date.now(),
        sharing,
        tripStatus,
        appActive: AppState.currentState === 'active',
        accuracy,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [
    home.isSuccess,
    home.dataUpdatedAt,
    sharing?.trip_request_id,
    sharing?.interval_sec,
    tripStatus,
  ]);

  useEffect(() => {
    if (!authenticated) dispatchSharing({ type: 'report_result', sharing: null });
  }, [authenticated]);

  useEffect(() => {
    void refreshEnvironment();
    const subscription = AppState.addEventListener('change', (next) => {
      if (next !== 'active') return;
      dispatchSharing({ type: 'foreground' });
      void refreshEnvironment();
      if (authenticated) void refetchHome();
    });
    return () => subscription.remove();
  }, [authenticated, refetchHome]);

  useEffect(() => {
    const remaining = remainingCapMs(machine, Date.now());
    if (remaining === null) return;
    const timer = setTimeout(
      () => dispatchSharing({ type: 'tick', now: Date.now() }),
      remaining + CAP_GRACE_MS,
    );
    return () => clearTimeout(timer);
  }, [machine]);
}

export type ResumeOutcome = 'idle' | 'checking' | 'offline' | 'failed';

export interface SharingResume {
  outcome: ResumeOutcome;
  resume: () => void;
}

export function useResumeSharing(): SharingResume {
  const queryClient = useQueryClient();
  const [outcome, setOutcome] = useState<ResumeOutcome>('idle');

  const resume = useCallback((): void => {
    setOutcome('checking');
    void (async () => {
      try {
        const fresh = await getDriverHome();
        queryClient.setQueryData(DRIVER_HOME_QUERY_KEY, fresh);
        dispatchSharing({
          type: 'resume',
          now: Date.now(),
          sharing: fresh.active_trip?.location_sharing ?? null,
          appActive: AppState.currentState === 'active',
          accuracy: await readLocationAccuracy(),
        });
        setOutcome('idle');
      } catch (error) {
        setOutcome(isNetworkError(error) ? 'offline' : 'failed');
      }
    })();
  }, [queryClient]);

  return { outcome, resume };
}

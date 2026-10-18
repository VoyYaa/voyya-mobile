import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { isNetworkError, useNetworkStatus, useSessionStore } from '@voyyaa/app-runtime';
import { SLOW_SIGNAL_THRESHOLD_MS, START_CODE_RECORD_TTL_MS } from '../constants/parameters';
import { activeTripRoute, savedTripRoute } from '../lib/active-trip-route';
import {
  resolveColdStart,
  serverProbe,
  startupPhaseOf,
  type StartupPhase,
} from '../lib/cold-start';
import { shouldPurgeSessionQueries } from '../lib/session-queries';
import { startCodeRecordStore } from '../lib/start-code-runtime';
import { purgeSessionScopedQueries, useActiveTrip, useActiveTripCache } from './useActiveTrip';

export type ActiveTripStartupPhase = StartupPhase;

export interface ActiveTripStartup {
  phase: ActiveTripStartupPhase;
  restored: boolean;
  retry: () => void;
  skip: () => void;
}

export function useActiveTripStartup(): ActiveTripStartup {
  const router = useRouter();
  const queryClient = useQueryClient();
  const session = useSessionStore((s) => s.status);
  const userId = useSessionStore((s) => s.user?.user_id ?? null);
  const authenticated = session === 'authenticated';
  const network = useNetworkStatus();
  const query = useActiveTrip();
  const cache = useActiveTripCache();
  const record = useSyncExternalStore(
    startCodeRecordStore.subscribe,
    startCodeRecordStore.getSnapshot,
  );
  const [skipped, setSkipped] = useState(false);
  const [routed, setRouted] = useState(false);
  const [restored, setRestored] = useState(false);
  const [slowSignal, setSlowSignal] = useState(false);
  const previousScope = useRef({ authenticated, userId });

  useEffect(() => {
    const scope = { authenticated, userId };
    if (shouldPurgeSessionQueries(previousScope.current, scope)) {
      purgeSessionScopedQueries(queryClient);
    }
    previousScope.current = scope;
    if (!authenticated) {
      setSkipped(false);
      setRouted(false);
      setRestored(false);
      setSlowSignal(false);
    }
  }, [authenticated, userId]);

  useEffect(() => {
    if (!authenticated || routed) return;
    const timer = setTimeout(() => setSlowSignal(true), SLOW_SIGNAL_THRESHOLD_MS);
    return () => clearTimeout(timer);
  }, [authenticated, routed]);

  const { decision, discardRecord } = resolveColdStart({
    session,
    userId,
    server: serverProbe({
      data: query.data,
      isError: query.isError,
      networkError: isNetworkError(query.error),
      offline: network === 'offline',
    }),
    record,
    slowSignal,
    now: Date.now(),
    ttlMs: START_CODE_RECORD_TTL_MS,
  });

  useEffect(() => {
    if (discardRecord) void startCodeRecordStore.clear();
  }, [discardRecord]);

  useEffect(() => {
    if (!authenticated || skipped || routed) return;
    if (decision.kind === 'server') {
      setRouted(true);
      if (decision.trip === null) return;
      const route = activeTripRoute(decision.trip);
      if (!route) return;
      cache.seed(decision.trip);
      router.replace(route);
      return;
    }
    if (decision.kind === 'restore') {
      setRouted(true);
      setRestored(true);
      router.replace(savedTripRoute(decision.record));
    }
  }, [authenticated, skipped, routed, decision.kind]);

  const failed = query.isError || (query.data === undefined && network === 'offline');
  useEffect(() => {
    if (network === 'online' && failed && !skipped) void query.refetch({ cancelRefetch: false });
  }, [network]);

  const retry = useCallback((): void => {
    void query.refetch();
  }, [query]);
  const skip = useCallback((): void => setSkipped(true), []);

  return { phase: startupPhaseOf(decision, { skipped, routed }), restored, retry, skip };
}

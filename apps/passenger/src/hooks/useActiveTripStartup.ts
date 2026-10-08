import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { isNetworkError, useNetworkStatus, useSessionStore } from '@voyyaa/app-runtime';
import { activeTripRoute } from '../lib/active-trip-route';
import { useActiveTrip, useActiveTripCache } from './useActiveTrip';

export type ActiveTripStartupPhase = 'idle' | 'checking' | 'error' | 'offline' | 'done';

export interface ActiveTripStartup {
  phase: ActiveTripStartupPhase;
  retry: () => void;
  skip: () => void;
}

export function useActiveTripStartup(): ActiveTripStartup {
  const router = useRouter();
  const queryClient = useQueryClient();
  const authenticated = useSessionStore((s) => s.status === 'authenticated');
  const network = useNetworkStatus();
  const query = useActiveTrip();
  const cache = useActiveTripCache();
  const [skipped, setSkipped] = useState(false);
  const [routed, setRouted] = useState(false);

  useEffect(() => {
    if (!authenticated) {
      setSkipped(false);
      setRouted(false);
      queryClient.removeQueries({ queryKey: ['trips', 'active'] });
    }
  }, [authenticated]);

  useEffect(() => {
    if (!authenticated || skipped || routed || query.data === undefined) return;
    setRouted(true);
    if (query.data === null) return;
    const route = activeTripRoute(query.data);
    if (!route) return;
    cache.seed(query.data);
    router.replace(route);
  }, [authenticated, skipped, routed, query.data]);

  const failed = query.isError || (query.data === undefined && network === 'offline');
  useEffect(() => {
    if (network === 'online' && failed && !skipped) void query.refetch();
  }, [network]);

  const retry = useCallback((): void => {
    void query.refetch();
  }, [query]);
  const skip = useCallback((): void => setSkipped(true), []);

  if (!authenticated) return { phase: 'idle', retry, skip };
  if (skipped || routed || query.data !== undefined) return { phase: 'done', retry, skip };
  if (query.isError) {
    const offline = network === 'offline' || isNetworkError(query.error);
    return { phase: offline ? 'offline' : 'error', retry, skip };
  }
  if (network === 'offline') return { phase: 'offline', retry, skip };
  return { phase: 'checking', retry, skip };
}

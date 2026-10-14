import { useCallback } from 'react';
import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import type { TripRequestStatus } from '@voyyaa/shared';
import { CONSENT_QUERY_PREFIX, useSessionStore } from '@voyyaa/app-runtime';
import { getActiveTrip } from '../api/trips.api';
import { ACTIVE_TRIP_QUERY_OPTIONS } from '../lib/trip-status-policy';

export const ACTIVE_TRIP_QUERY_PREFIX = ['trips', 'active'] as const;
export const TRIP_REQUEST_QUERY_PREFIX = ['tripRequest'] as const;
export const SESSION_SCOPED_QUERY_PREFIXES = [
  TRIP_REQUEST_QUERY_PREFIX,
  ACTIVE_TRIP_QUERY_PREFIX,
  CONSENT_QUERY_PREFIX,
] as const;

export function purgeSessionScopedQueries(queryClient: QueryClient): void {
  for (const queryKey of SESSION_SCOPED_QUERY_PREFIXES) {
    void queryClient.cancelQueries({ queryKey });
    queryClient.removeQueries({ queryKey });
  }
}

export function activeTripQueryKey(userId: number | null): readonly unknown[] {
  return [...ACTIVE_TRIP_QUERY_PREFIX, userId];
}

export function tripRequestQueryKey(tripRequestId: number | null): readonly unknown[] {
  return [...TRIP_REQUEST_QUERY_PREFIX, tripRequestId];
}

async function fetchActiveTrip(): Promise<TripRequestStatus | null> {
  const response = await getActiveTrip();
  return response.active_trip;
}

export function useActiveTrip() {
  const authenticated = useSessionStore((s) => s.status === 'authenticated');
  const userId = useSessionStore((s) => s.user?.user_id ?? null);
  return useQuery({
    queryKey: activeTripQueryKey(userId),
    queryFn: fetchActiveTrip,
    enabled: authenticated,
    ...ACTIVE_TRIP_QUERY_OPTIONS,
  });
}

export interface ActiveTripCache {
  clear: () => void;
  refresh: () => Promise<TripRequestStatus | null>;
  seed: (trip: TripRequestStatus) => void;
}

export function useActiveTripCache(): ActiveTripCache {
  const queryClient = useQueryClient();
  const userId = useSessionStore((s) => s.user?.user_id ?? null);

  const clear = useCallback((): void => {
    queryClient.setQueryData(activeTripQueryKey(userId), null);
  }, [queryClient, userId]);

  const refresh = useCallback(
    (): Promise<TripRequestStatus | null> =>
      queryClient.fetchQuery({
        queryKey: activeTripQueryKey(userId),
        queryFn: fetchActiveTrip,
        staleTime: 0,
      }),
    [queryClient, userId],
  );

  const seed = useCallback(
    (trip: TripRequestStatus): void => {
      queryClient.setQueryData(tripRequestQueryKey(trip.trip_request_id), trip);
    },
    [queryClient],
  );

  return { clear, refresh, seed };
}

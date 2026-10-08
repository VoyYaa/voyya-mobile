import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { TripRequestStatus } from '@voyyaa/shared';
import { useSessionStore } from '@voyyaa/app-runtime';
import { getActiveTrip } from '../api/trips.api';

export function activeTripQueryKey(userId: number | null): readonly unknown[] {
  return ['trips', 'active', userId];
}

export function tripRequestQueryKey(tripRequestId: number | null): readonly unknown[] {
  return ['tripRequest', tripRequestId];
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

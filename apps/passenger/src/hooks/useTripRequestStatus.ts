import { useQuery } from '@tanstack/react-query';
import { useSessionStore } from '@voyyaa/app-runtime';
import { getTripRequestStatus } from '../api/trips.api';
import {
  TRIP_STATUS_RESUME_OPTIONS,
  tripStatusQueryEnabled,
  tripStatusRefetchInterval,
} from '../lib/trip-status-policy';
import { tripRequestQueryKey } from './useActiveTrip';

export function useTripRequestStatus(tripRequestId: number | null) {
  const authenticated = useSessionStore((s) => s.status === 'authenticated');
  return useQuery({
    queryKey: tripRequestQueryKey(tripRequestId),
    queryFn: () => getTripRequestStatus(tripRequestId as number),
    enabled: tripStatusQueryEnabled(tripRequestId, authenticated),
    refetchInterval: (query) => tripStatusRefetchInterval(query.state.data),
    ...TRIP_STATUS_RESUME_OPTIONS,
  });
}

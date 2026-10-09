import { useQuery } from '@tanstack/react-query';
import { getTripRequestStatus } from '../api/trips.api';
import { TRIP_STATUS_RESUME_OPTIONS, tripStatusRefetchInterval } from '../lib/trip-status-policy';
import { tripRequestQueryKey } from './useActiveTrip';

export function useTripRequestStatus(tripRequestId: number | null) {
  return useQuery({
    queryKey: tripRequestQueryKey(tripRequestId),
    queryFn: () => getTripRequestStatus(tripRequestId as number),
    enabled: tripRequestId !== null,
    refetchInterval: (query) => tripStatusRefetchInterval(query.state.data),
    ...TRIP_STATUS_RESUME_OPTIONS,
  });
}

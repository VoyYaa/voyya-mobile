import { useQuery } from '@tanstack/react-query';
import { isTerminalTripStatus } from '@voyyaa/shared';
import { getTripRequestStatus } from '../api/trips.api';
import { TRIP_REQUEST_STATUS_POLL_MS } from '../constants/parameters';
import { tripRequestQueryKey } from './useActiveTrip';

export function useTripRequestStatus(tripRequestId: number | null) {
  return useQuery({
    queryKey: tripRequestQueryKey(tripRequestId),
    queryFn: () => getTripRequestStatus(tripRequestId as number),
    enabled: tripRequestId !== null,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return TRIP_REQUEST_STATUS_POLL_MS;
      return isTerminalTripStatus(data.status) ? false : TRIP_REQUEST_STATUS_POLL_MS;
    },
  });
}

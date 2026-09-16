import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { PendingCashTripsResponse } from '@voyyaa/shared';
import { confirmCashCollected } from '../api/trips.api';
import { PENDING_CASH_TRIPS_QUERY_KEY } from './usePendingCashTrips';

export function useConfirmCashCollected() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tripRequestId: number) => confirmCashCollected(tripRequestId),
    retry: false,
    onSuccess: (_result, tripRequestId) => {
      queryClient.setQueryData<PendingCashTripsResponse>(PENDING_CASH_TRIPS_QUERY_KEY, (current) =>
        current ? current.filter((trip) => trip.trip_request_id !== tripRequestId) : current,
      );
    },
  });
}

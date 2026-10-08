import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { PendingCashTripsResponse } from '@voyyaa/shared';
import { confirmCashCollected } from '../api/trips.api';
import { PENDING_CASH_TRIPS_QUERY_KEY } from './usePendingCashTrips';

export function useConfirmCashCollected() {
  return useMutation({
    mutationFn: (tripRequestId: number) => confirmCashCollected(tripRequestId),
    retry: false,
  });
}

export function useRemovePendingCashTrip(): (tripRequestId: number) => void {
  const queryClient = useQueryClient();
  return (tripRequestId) =>
    queryClient.setQueryData<PendingCashTripsResponse>(PENDING_CASH_TRIPS_QUERY_KEY, (current) =>
      current ? current.filter((trip) => trip.trip_request_id !== tripRequestId) : current,
    );
}

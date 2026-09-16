import { useQuery } from '@tanstack/react-query';
import { listPendingCashTrips } from '../api/driver.api';

export const PENDING_CASH_TRIPS_QUERY_KEY = ['pending-cash-trips'] as const;

export function usePendingCashTrips() {
  return useQuery({
    queryKey: PENDING_CASH_TRIPS_QUERY_KEY,
    queryFn: listPendingCashTrips,
  });
}

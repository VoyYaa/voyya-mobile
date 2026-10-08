import { useQuery } from '@tanstack/react-query';
import { listPendingCashTrips } from '../api/driver.api';
import { useIsAuthenticated } from './useIsAuthenticated';

export const PENDING_CASH_TRIPS_QUERY_KEY = ['pending-cash-trips'] as const;

export function usePendingCashTrips() {
  const authenticated = useIsAuthenticated();
  return useQuery({
    queryKey: PENDING_CASH_TRIPS_QUERY_KEY,
    queryFn: listPendingCashTrips,
    enabled: authenticated,
  });
}

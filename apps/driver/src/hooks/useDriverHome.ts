import { useQuery } from '@tanstack/react-query';
import { getDriverHome } from '../api/driver.api';
import { ACTIVE_TRIP_POLL_MS } from '../constants/parameters';
import { useIsAuthenticated } from './useIsAuthenticated';

export const DRIVER_HOME_QUERY_KEY = ['driver-home'] as const;

export function useDriverHome() {
  const authenticated = useIsAuthenticated();
  return useQuery({
    queryKey: DRIVER_HOME_QUERY_KEY,
    queryFn: getDriverHome,
    enabled: authenticated,
    refetchInterval: (query) => (query.state.data?.active_trip ? ACTIVE_TRIP_POLL_MS : false),
  });
}

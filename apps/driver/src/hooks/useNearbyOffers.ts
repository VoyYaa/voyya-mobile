import { useQuery } from '@tanstack/react-query';
import { listNearbyOffers } from '../api/assignment.api';
import { NEARBY_OFFERS_POLL_MS } from '../constants/parameters';
import { useIsAuthenticated } from './useIsAuthenticated';

export const NEARBY_OFFERS_QUERY_KEY = ['nearby-offers'] as const;

export function useNearbyOffers(onShift: boolean) {
  const authenticated = useIsAuthenticated();
  const enabled = authenticated && onShift;
  return useQuery({
    queryKey: NEARBY_OFFERS_QUERY_KEY,
    queryFn: listNearbyOffers,
    enabled,
    refetchInterval: enabled ? NEARBY_OFFERS_POLL_MS : false,
  });
}

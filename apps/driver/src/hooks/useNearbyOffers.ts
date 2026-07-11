import { useQuery } from '@tanstack/react-query';
import { listNearbyOffers } from '../api/assignment.api';
import { NEARBY_OFFERS_POLL_MS } from '../constants/parameters';

export const NEARBY_OFFERS_QUERY_KEY = ['nearby-offers'] as const;

export function useNearbyOffers(onShift: boolean) {
  return useQuery({
    queryKey: NEARBY_OFFERS_QUERY_KEY,
    queryFn: listNearbyOffers,
    enabled: onShift,
    refetchInterval: onShift ? NEARBY_OFFERS_POLL_MS : false,
  });
}

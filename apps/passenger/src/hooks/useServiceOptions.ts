import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Location, TripServiceOptionsResponse } from '@voyyaa/shared';
import { getServiceOptions } from '../api/trips.api';
import { SERVICE_OPTIONS_STALE_MS } from '../constants/parameters';
import { useTripDraftStore } from '../state/useTripDraftStore';

type Coordinate = Pick<Location, 'lat' | 'lng'>;

export function serviceOptionsQueryKey(coordinate: Coordinate | null): readonly unknown[] {
  return ['trips', 'service-options', coordinate?.lat ?? null, coordinate?.lng ?? null];
}

export function useServiceOptionsAt(coordinate: Coordinate | null) {
  return useQuery({
    queryKey: serviceOptionsQueryKey(coordinate),
    queryFn: () => getServiceOptions(coordinate as Coordinate),
    enabled: coordinate !== null,
    staleTime: SERVICE_OPTIONS_STALE_MS,
    retry: 1,
  });
}

export function usePickupServiceOptions() {
  const origin = useTripDraftStore((s) => s.origin);
  const query = useServiceOptionsAt(origin);
  const municipalityId = query.data?.municipality?.municipality_id ?? null;
  return { query, municipalityId };
}

export function useVerifyPickup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (pickup: Coordinate): Promise<TripServiceOptionsResponse> =>
      getServiceOptions(pickup),
    onSuccess: (options, pickup) => {
      queryClient.setQueryData(serviceOptionsQueryKey(pickup), options);
    },
    retry: false,
  });
}

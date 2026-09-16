import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CompleteTripDTO } from '@voyyaa/shared';
import {
  completeTrip,
  declareNoShow,
  markTripArrived,
  markTripEnRoute,
  startTrip,
} from '../api/trips.api';
import { DRIVER_HOME_QUERY_KEY } from './useDriverHome';

function rejectNoActiveTrip(): Promise<never> {
  return Promise.reject(new Error('No hay un viaje activo.'));
}

export function useMarkTripEnRoute(tripRequestId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      tripRequestId === null ? rejectNoActiveTrip() : markTripEnRoute(tripRequestId),
    retry: false,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: DRIVER_HOME_QUERY_KEY }),
  });
}

export function useMarkTripArrived(tripRequestId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      tripRequestId === null ? rejectNoActiveTrip() : markTripArrived(tripRequestId),
    retry: false,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: DRIVER_HOME_QUERY_KEY }),
  });
}

export function useStartTrip(tripRequestId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => (tripRequestId === null ? rejectNoActiveTrip() : startTrip(tripRequestId)),
    retry: false,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: DRIVER_HOME_QUERY_KEY }),
  });
}

export function useCompleteTrip(tripRequestId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CompleteTripDTO) =>
      tripRequestId === null ? rejectNoActiveTrip() : completeTrip(tripRequestId, dto),
    retry: false,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: DRIVER_HOME_QUERY_KEY }),
  });
}

export function useDeclareNoShow(tripRequestId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      tripRequestId === null ? rejectNoActiveTrip() : declareNoShow(tripRequestId),
    retry: false,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: DRIVER_HOME_QUERY_KEY }),
  });
}

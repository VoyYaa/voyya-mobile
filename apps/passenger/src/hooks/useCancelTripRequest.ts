import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CancelTripRequestDTO } from '@voyyaa/shared';
import { cancelTripRequest } from '../api/trips.api';

export function useCancelTripRequest(tripRequestId: number | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto?: CancelTripRequestDTO) => {
      if (tripRequestId === null) {
        return Promise.reject(new Error('No hay una solicitud activa para cancelar.'));
      }
      return cancelTripRequest(tripRequestId, dto ?? {});
    },
    retry: false,
    onSuccess: () => {
      if (tripRequestId !== null) {
        void queryClient.invalidateQueries({ queryKey: ['tripRequest', tripRequestId] });
      }
    },
  });
}

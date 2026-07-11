import { useMutation } from '@tanstack/react-query';
import type { CreateTripRequestDTO } from '@voyyaa/shared';
import { createTripRequest } from '../api/trips.api';

export function useCreateTripRequest() {
  return useMutation({
    mutationFn: (dto: CreateTripRequestDTO) => createTripRequest(dto),
    retry: false,
  });
}

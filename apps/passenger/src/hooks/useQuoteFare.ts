import { useMutation } from '@tanstack/react-query';
import type { QuoteFareDTO } from '@voyyaa/shared';
import { quoteFare } from '../api/trips.api';

export function useQuoteFare() {
  return useMutation({
    mutationFn: (dto: QuoteFareDTO) => quoteFare(dto),
    retry: false,
  });
}

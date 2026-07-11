import { useMutation } from '@tanstack/react-query';
import type { RequestOtpDTO } from '@voyyaa/shared';
import { requestOtp } from '../api/auth.api';

export function useRequestOtp() {
  return useMutation({
    mutationFn: (dto: RequestOtpDTO) => requestOtp(dto),
    retry: false,
  });
}

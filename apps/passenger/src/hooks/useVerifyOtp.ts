import { useMutation } from '@tanstack/react-query';
import type { VerifyOtpDTO } from '@voyyaa/shared';
import { verifyOtp } from '../api/auth.api';

export function useVerifyOtp() {
  return useMutation({
    mutationFn: (dto: VerifyOtpDTO) => verifyOtp(dto),
    retry: false,
  });
}

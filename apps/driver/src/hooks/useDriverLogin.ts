import { useMutation } from '@tanstack/react-query';
import type { DriverLoginDTO } from '@voyyaa/shared';
import { driverLogin } from '../api/auth.api';

export function useDriverLogin() {
  return useMutation({
    mutationFn: (dto: DriverLoginDTO) => driverLogin(dto),
    retry: false,
  });
}

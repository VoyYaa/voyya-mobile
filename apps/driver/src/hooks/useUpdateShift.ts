import { useMutation, useQueryClient } from '@tanstack/react-query';
import { handleLocationConsentRequired } from '@voyyaa/app-runtime';
import type { DriverHomeState, UpdateDriverShiftDTO } from '@voyyaa/shared';
import { updateDriverShift } from '../api/driver.api';
import { DRIVER_HOME_QUERY_KEY } from './useDriverHome';

export function useUpdateShift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: UpdateDriverShiftDTO) => updateDriverShift(dto),
    retry: false,
    onError: (error) => {
      void handleLocationConsentRequired(error);
    },
    onSuccess: (shift) => {
      queryClient.setQueryData<DriverHomeState>(DRIVER_HOME_QUERY_KEY, (current) =>
        current ? { ...current, shift } : current,
      );
      void queryClient.invalidateQueries({ queryKey: DRIVER_HOME_QUERY_KEY });
    },
  });
}

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ChangeDriverPinDTO } from '@voyyaa/shared';
import { useSessionStore } from '@voyyaa/app-runtime';
import { changeDriverPin } from '../api/auth.api';
import { forgetTemporaryPin } from '../auth/remembered-pin';
import { usePinGateStore } from '../auth/usePinGateStore';
import { DRIVER_HOME_QUERY_KEY } from './useDriverHome';

export function useChangeDriverPin() {
  const queryClient = useQueryClient();
  const setSession = useSessionStore((s) => s.setSession);

  return useMutation({
    mutationFn: (dto: ChangeDriverPinDTO) => changeDriverPin(dto),
    retry: false,
    onSuccess: async (response) => {
      usePinGateStore.getState().setCelebrating(true);
      usePinGateStore.getState().setForced(false);
      forgetTemporaryPin();
      await setSession(response);
      void queryClient.invalidateQueries({ queryKey: DRIVER_HOME_QUERY_KEY });
    },
  });
}

import { useMutation } from '@tanstack/react-query';
import { logout } from '../api/session.api';
import { useSessionStore, waitForSessionRefresh } from './useSessionStore';

export function useLogout() {
  return useMutation({
    mutationFn: async () => {
      await waitForSessionRefresh();
      const { refreshToken } = useSessionStore.getState();
      try {
        if (refreshToken) {
          await logout({ refresh_token: refreshToken });
        }
      } finally {
        await useSessionStore.getState().clearSession();
      }
    },
    retry: false,
  });
}

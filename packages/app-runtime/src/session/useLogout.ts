import { useMutation } from '@tanstack/react-query';
import { logout } from '../api/session.api';
import { useSessionStore } from './useSessionStore';

export function useLogout() {
  return useMutation({
    mutationFn: async () => {
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

// =============================================================================
// VoyYa Conductor — useLogout
// -----------------------------------------------------------------------------
// Mismo patrón que apps/passenger/src/hooks/useLogout.ts. Logout IDEMPOTENTE
// (D-A05): el cliente limpia su sesión local en un `finally` SIN depender de
// la respuesta del servidor.
// =============================================================================

import { useMutation } from '@tanstack/react-query';
import { cerrarSesion } from '../api/auth.api';
import { useSessionStore } from '../state/useSessionStore';

export function useLogout() {
  return useMutation({
    mutationFn: async () => {
      const { refreshToken } = useSessionStore.getState();
      try {
        if (refreshToken) {
          await cerrarSesion({ refresh_token: refreshToken });
        }
      } finally {
        await useSessionStore.getState().clearSession();
      }
    },
    retry: false,
  });
}

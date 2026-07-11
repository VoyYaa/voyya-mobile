// =============================================================================
// VoyYa Pasajero — useProactiveRefresh
// -----------------------------------------------------------------------------
// Programa `/auth/refresh` ~1 min ANTES de que expire el access token (D-A04):
// no depender solo del interceptor reactivo de 401 (http-client.ts), que sigue
// siendo la red de seguridad si este timer no alcanzó a dispararse (app en
// segundo plano, reloj del dispositivo). Se reprograma solo cuando cambia
// `accessTokenExpiresAt` (login, rotación) — un único timer vivo a la vez.
// Montado una vez en app/_layout.tsx.
// =============================================================================

import { useEffect } from 'react';
import { intentarRefrescarSesion, useSessionStore } from '../state/useSessionStore';

const MARGEN_PROACTIVO_MS = 60_000;

export function useProactiveRefresh(): void {
  const status = useSessionStore((s) => s.status);
  const accessTokenExpiresAt = useSessionStore((s) => s.accessTokenExpiresAt);

  useEffect(() => {
    if (status !== 'authenticated' || !accessTokenExpiresAt) return;

    const delayMs = Math.max(0, accessTokenExpiresAt - Date.now() - MARGEN_PROACTIVO_MS);
    const timer = setTimeout(() => {
      void intentarRefrescarSesion();
    }, delayMs);

    return () => clearTimeout(timer);
  }, [status, accessTokenExpiresAt]);
}

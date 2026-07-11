// =============================================================================
// VoyYa Conductor — useProactiveRefresh
// -----------------------------------------------------------------------------
// Mismo patrón que apps/passenger/src/hooks/useProactiveRefresh.ts. Programa
// `/auth/refresh` ~1 min ANTES de que expire el access token (D-A04) — el
// interceptor reactivo de 401 (http-client.ts) sigue siendo la red de
// seguridad si este timer no alcanzó a dispararse. Montado una vez en
// app/_layout.tsx.
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

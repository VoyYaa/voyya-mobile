// =============================================================================
// VoyYa Conductor — useRouteGuard
// -----------------------------------------------------------------------------
// Mismo patrón que apps/passenger/src/hooks/useRouteGuard.ts. Redirige según el
// `status` de la sesión: sin sesión → app/(auth)/ingreso; con sesión estando
// dentro de (auth) → Home/Turno ("/"). Mientras `status === 'hydrating'` no
// redirige — evita un parpadeo a login antes de terminar de leer
// expo-secure-store (ver app/_layout.tsx).
// =============================================================================

import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useSessionStore } from '../state/useSessionStore';

export function useRouteGuard(): void {
  const status = useSessionStore((s) => s.status);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (status === 'hydrating') return;
    const enGrupoAuth = segments[0] === '(auth)';

    if (status === 'guest' && !enGrupoAuth) {
      router.replace('/(auth)/ingreso');
    } else if (status === 'authenticated' && enGrupoAuth) {
      router.replace('/');
    }
  }, [status, segments, router]);
}

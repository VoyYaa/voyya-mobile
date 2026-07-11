// =============================================================================
// VoyYa Pasajero — useRouteGuard
// -----------------------------------------------------------------------------
// Redirige según el `status` de la sesión: sin sesión → app/(auth)/telefono;
// con sesión estando dentro de (auth) → Home ("/"). Patrón estándar de
// expo-router para versiones sin `Stack.Protected` (aquí expo-router ~3.5):
// comparar el primer segmento de la ruta actual contra el grupo `(auth)`.
// Mientras `status === 'hydrating'` no redirige — evita un parpadeo a login
// antes de terminar de leer expo-secure-store (ver app/_layout.tsx).
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
      router.replace('/(auth)/telefono');
    } else if (status === 'authenticated' && enGrupoAuth) {
      router.replace('/');
    }
  }, [status, segments, router]);
}

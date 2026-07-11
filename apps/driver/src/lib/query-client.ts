// =============================================================================
// VoyYa Conductor — QueryClient (TanStack Query)
// -----------------------------------------------------------------------------
// Mismo patrón que apps/passenger/src/lib/query-client.ts. Las MUTACIONES
// (aceptar/rechazar) NUNCA reintentan solas (idempotencia — coding-standards.md):
// un retry silencioso podría disparar dos tomas/rechazos contra el mismo
// recurso escaso. Las QUERIES (lista de solicitudes cercanas) sí reintentan.
// =============================================================================

import { QueryClient } from '@tanstack/react-query';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 2,
        staleTime: 2000,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

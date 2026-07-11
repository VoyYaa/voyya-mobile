// =============================================================================
// VoyYa Pasajero — QueryClient (TanStack Query)
// -----------------------------------------------------------------------------
// Defaults deliberados: las MUTACIONES (crear/cancelar solicitud) NUNCA
// reintentan solas — evita crear/cancelar dos veces por un reintento
// silencioso (coding-standards.md: idempotencia donde importa). Las QUERIES sí
// reintentan (lectura, no compromiso) pero con backoff acotado.
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

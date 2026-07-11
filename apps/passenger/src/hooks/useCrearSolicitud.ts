// =============================================================================
// VoyYa Pasajero — useCrearSolicitud
// -----------------------------------------------------------------------------
// POST /trips. Sin reintento automático (evita crear la solicitud dos veces
// por un reintento silencioso — coding-standards.md, idempotencia). Si falla
// por conexión o por dominio (410 COTIZACION_EXPIRADA, 409 ...), la pantalla
// decide la recuperación explícitamente (ver app/confirmar.tsx).
// =============================================================================

import { useMutation } from '@tanstack/react-query';
import type { CrearSolicitudDTO } from '@voyya/shared';
import { crearSolicitud } from '../api/trips.api';

export function useCrearSolicitud() {
  return useMutation({
    mutationFn: (dto: CrearSolicitudDTO) => crearSolicitud(dto),
    retry: false,
  });
}

// =============================================================================
// VoyYa Pasajero — useCancelarSolicitud
// -----------------------------------------------------------------------------
// POST /trips/:id/cancelar. NO optimista (pasajero-estados-borde.md §6.4): la
// pantalla debe esperar la respuesta del servidor (`gratuita`/`penalidad_registrada`)
// antes de mostrar el toast de confirmación — el servidor es la autoridad.
// =============================================================================

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CancelarSolicitudDTO } from '@voyya/shared';
import { cancelarSolicitud } from '../api/trips.api';

export function useCancelarSolicitud(idSolicitud: number | null) {
  const queryClient = useQueryClient();

  return useMutation({
    // `dto` explícitamente opcional (no solo con default) para que `TVariables`
    // incluya `undefined` y `cancelar.mutate()`/`mutate(undefined, ...)` tipen
    // bien en las pantallas (TanStack Query infiere desde este parámetro).
    mutationFn: (dto?: CancelarSolicitudDTO) => {
      if (idSolicitud === null) {
        return Promise.reject(new Error('No hay una solicitud activa para cancelar.'));
      }
      return cancelarSolicitud(idSolicitud, dto ?? {});
    },
    retry: false,
    onSuccess: () => {
      if (idSolicitud !== null) {
        void queryClient.invalidateQueries({ queryKey: ['solicitud', idSolicitud] });
      }
    },
  });
}

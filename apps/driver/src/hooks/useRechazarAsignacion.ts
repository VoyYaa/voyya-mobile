// =============================================================================
// VoyYa Conductor — useRechazarAsignacion
// -----------------------------------------------------------------------------
// POST /assignments/:id/rechazar (HU-09). Sin penalidad, sin reintento
// automático (idempotencia). También se reutiliza para el back de Android
// durante el countdown (§3.6: back del sistema equivale a Rechazar).
// =============================================================================

import { useMutation } from '@tanstack/react-query';
import type { RechazarAsignacionDTO } from '@voyya/shared';
import { rechazarAsignacion } from '../api/assignment.api';

export function useRechazarAsignacion(idAsignacion: number | null) {
  return useMutation({
    mutationFn: (dto?: RechazarAsignacionDTO) => {
      if (idAsignacion === null) {
        return Promise.reject(new Error('No hay una solicitud activa para rechazar.'));
      }
      return rechazarAsignacion(idAsignacion, dto ?? {});
    },
    retry: false,
  });
}

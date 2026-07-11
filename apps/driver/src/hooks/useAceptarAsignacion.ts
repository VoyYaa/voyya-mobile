// =============================================================================
// VoyYa Conductor — useAceptarAsignacion
// -----------------------------------------------------------------------------
// POST /assignments/:id/aceptar. NO optimista (regla explícita de esta tarea y
// de §3.4.2): la pantalla NUNCA muestra "¡Aceptada!" antes de que el servidor
// confirme la toma única — `mutation.data.resultado` es la ÚNICA fuente de
// verdad ('aceptada' | 'ya_tomada' | 'expirada'). Sin reintento automático
// (idempotencia — coding-standards.md): un retry silencioso podría disparar dos
// intentos de toma contra el mismo recurso escaso.
// =============================================================================

import { useMutation } from '@tanstack/react-query';
import type { AceptarAsignacionDTO } from '@voyya/shared';
import { aceptarAsignacion } from '../api/assignment.api';

export function useAceptarAsignacion(idAsignacion: number | null) {
  return useMutation({
    // `dto` explícitamente opcional (no solo con default) para que `mutate()`
    // sin argumentos tipe bien — mismo idiom que useCancelarSolicitud (passenger).
    mutationFn: (dto?: AceptarAsignacionDTO) => {
      if (idAsignacion === null) {
        return Promise.reject(new Error('No hay una solicitud activa para aceptar.'));
      }
      return aceptarAsignacion(idAsignacion, dto ?? {});
    },
    retry: false,
  });
}

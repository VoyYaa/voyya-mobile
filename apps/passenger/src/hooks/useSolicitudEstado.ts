// =============================================================================
// VoyYa Pasajero — useSolicitudEstado
// -----------------------------------------------------------------------------
// GET /trips/:id con polling. Fuente de verdad del estado del viaje mientras
// el pasajero espera asignación o ve a su conductor. Deja de hacer polling
// cuando la solicitud llega a un estado terminal (reusa `esEstadoSolicitudTerminal`
// de @voyya/shared — DRY, no se reinventa qué es "terminal").
// =============================================================================

import { useQuery } from '@tanstack/react-query';
import { esEstadoSolicitudTerminal } from '@voyya/shared';
import { obtenerEstadoSolicitud } from '../api/trips.api';
import { POLL_ESTADO_SOLICITUD_MS } from '../constants/parametros';

export function useSolicitudEstado(idSolicitud: number | null) {
  return useQuery({
    queryKey: ['solicitud', idSolicitud],
    queryFn: () => obtenerEstadoSolicitud(idSolicitud as number),
    enabled: idSolicitud !== null,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return POLL_ESTADO_SOLICITUD_MS;
      return esEstadoSolicitudTerminal(data.estado) ? false : POLL_ESTADO_SOLICITUD_MS;
    },
  });
}

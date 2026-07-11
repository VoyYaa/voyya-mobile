// =============================================================================
// VoyYa Conductor — useSolicitudesCercanas
// -----------------------------------------------------------------------------
// Lista de candidatos notificados/cercanos dentro del radio (§2 de
// conductor-solicitud-asignacion.md). `enabled: enTurno` implementa la regla
// explícita de §2.3: "Fuera de turno: no se hace fetch de solicitudes" — la
// pantalla pinta el panel bloqueante en su lugar, sin llamar al servidor.
//
// Transporte: POLLING (TanStack Query), no push/socket — el `PushProvider` del
// backend es hoy un stub no-op (apps/api/.../providers/noop-push.provider.ts) y
// no hay gateway de sockets implementado para el conductor todavía. Mismo
// criterio que `useSolicitudEstado` en apps/passenger: REST + polling es la
// fuente de verdad; un futuro hook de socket solo aceleraría el refresco sin
// reemplazar este.
// =============================================================================

import { useQuery } from '@tanstack/react-query';
import { listarSolicitudesCercanas } from '../api/assignment.api';
import { POLL_SOLICITUDES_CERCANAS_MS } from '../constants/parametros';

export const SOLICITUDES_CERCANAS_QUERY_KEY = ['solicitudes-cercanas'] as const;

export function useSolicitudesCercanas(enTurno: boolean) {
  return useQuery({
    queryKey: SOLICITUDES_CERCANAS_QUERY_KEY,
    queryFn: listarSolicitudesCercanas,
    enabled: enTurno,
    refetchInterval: enTurno ? POLL_SOLICITUDES_CERCANAS_MS : false,
  });
}

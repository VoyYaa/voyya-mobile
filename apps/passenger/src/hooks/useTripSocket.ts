// =============================================================================
// VoyYa Pasajero — useTripSocket (aislado, opcional)
// -----------------------------------------------------------------------------
// Suscripción por socket para refrescar el estado de una solicitud más rápido
// que el polling. Aislado a propósito (SRP): si el socket falla, no conecta, o
// se desactiva, `useSolicitudEstado` (REST + polling) sigue siendo la fuente
// de verdad — este hook solo ACELERA el refresco emitiendo un `invalidateQueries`,
// nunca parsea un payload de socket nuevo ni reemplaza el tipado de @voyya/shared.
// Los nombres de evento se reusan de `EVENTOS_TRIPS`/`EVENTOS_ASSIGNMENT`
// (fuente única) — no se inventan strings nuevos aquí.
// =============================================================================

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io, type Socket } from 'socket.io-client';
import { EVENTOS_ASSIGNMENT, EVENTOS_TRIPS } from '@voyya/shared';

const DEFAULT_BASE_URL = 'http://localhost:3000';

function resolveSocketUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  return fromEnv && fromEnv.length > 0 ? fromEnv : DEFAULT_BASE_URL;
}

// Eventos del servidor que pueden afectar el estado de ESTA solicitud.
const EVENTOS_RELEVANTES: readonly string[] = [
  EVENTOS_TRIPS.SOLICITUD_SIN_CONDUCTOR,
  EVENTOS_TRIPS.SOLICITUD_EXPIRADA,
  EVENTOS_ASSIGNMENT.CONDUCTOR_ASIGNADO,
  EVENTOS_ASSIGNMENT.ASIGNACION_CANCELADA_CONDUCTOR,
];

export function useTripSocket(idSolicitud: number | null, enabled = true): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || idSolicitud === null) return;

    const socket: Socket = io(resolveSocketUrl(), {
      transports: ['websocket'],
      reconnection: true,
    });

    const refrescar = (): void => {
      void queryClient.invalidateQueries({ queryKey: ['solicitud', idSolicitud] });
    };

    socket.on('connect', () => socket.emit('join', { room: `solicitud:${idSolicitud}` }));
    EVENTOS_RELEVANTES.forEach((evento) => socket.on(evento, refrescar));

    return () => {
      socket.disconnect();
    };
  }, [idSolicitud, enabled, queryClient]);
}

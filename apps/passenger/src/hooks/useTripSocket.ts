import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io, type Socket } from 'socket.io-client';
import { ASSIGNMENT_EVENTS, TRIPS_EVENTS } from '@voyyaa/shared';
import { getApiBaseUrl } from '@voyyaa/app-runtime';

const RELEVANT_EVENTS: readonly string[] = [
  TRIPS_EVENTS.TRIP_REQUEST_NO_DRIVER,
  TRIPS_EVENTS.TRIP_REQUEST_EXPIRED,
  ASSIGNMENT_EVENTS.DRIVER_ASSIGNED,
  ASSIGNMENT_EVENTS.ASSIGNMENT_CANCELLED_BY_DRIVER,
];

export function useTripSocket(tripRequestId: number | null, enabled = true): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || tripRequestId === null) return;

    const socket: Socket = io(getApiBaseUrl(), {
      transports: ['websocket'],
      reconnection: true,
    });

    const refresh = (): void => {
      void queryClient.invalidateQueries({ queryKey: ['tripRequest', tripRequestId] });
    };

    socket.on('connect', () => socket.emit('join', { room: `tripRequest:${tripRequestId}` }));
    RELEVANT_EVENTS.forEach((event) => socket.on(event, refresh));

    return () => {
      socket.disconnect();
    };
  }, [tripRequestId, enabled, queryClient]);
}

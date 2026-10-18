import { isTerminalTripStatus, type TripRequestStatus } from '@voyyaa/shared';
import { SAVED_TRIP_SOURCE_PARAM, SAVED_TRIP_SOURCE_VALUE } from '../constants/route-params';
import type { StartCodeRecord } from './start-code-record';

export interface ActiveTripRoute {
  pathname: '/searching' | '/driver-assigned';
  params: { id: string };
}

export function activeTripRoute(trip: TripRequestStatus): ActiveTripRoute | null {
  if (isTerminalTripStatus(trip.status)) return null;
  const params = { id: String(trip.trip_request_id) };
  if (trip.status === 'pending_assignment') return { pathname: '/searching', params };
  return { pathname: '/driver-assigned', params };
}

export interface SavedTripRoute {
  pathname: '/driver-assigned';
  params: { id: string; [SAVED_TRIP_SOURCE_PARAM]: typeof SAVED_TRIP_SOURCE_VALUE };
}

export function savedTripRoute(record: StartCodeRecord): SavedTripRoute {
  return {
    pathname: '/driver-assigned',
    params: {
      id: String(record.trip_request_id),
      [SAVED_TRIP_SOURCE_PARAM]: SAVED_TRIP_SOURCE_VALUE,
    },
  };
}

export interface CurrentRoute {
  pathname: string;
  id: string | undefined;
}

export function isSameTripRoute(current: CurrentRoute, route: ActiveTripRoute): boolean {
  return current.pathname === route.pathname && current.id === route.params.id;
}

import { isTerminalTripStatus, type TripRequestStatus } from '@voyyaa/shared';

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

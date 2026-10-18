import { isTerminalTripStatus, type TripStatus } from '@voyyaa/shared';

export const TRIP_STATUS_POLL_MS = 4000;

export const TRIP_STATUS_RESUME_OPTIONS = {
  staleTime: 0,
  refetchOnWindowFocus: 'always',
} as const;

export const ACTIVE_TRIP_QUERY_OPTIONS = {
  refetchOnReconnect: 'always',
} as const;

export function tripStatusQueryEnabled(
  tripRequestId: number | null,
  authenticated: boolean,
): boolean {
  return tripRequestId !== null && authenticated;
}

export function tripStatusRefetchInterval(
  data: { status: TripStatus } | undefined,
): number | false {
  if (!data) return TRIP_STATUS_POLL_MS;
  return isTerminalTripStatus(data.status) ? false : TRIP_STATUS_POLL_MS;
}

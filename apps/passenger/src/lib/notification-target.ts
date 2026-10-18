import { PassengerPushData, type TripRequestStatus } from '@voyyaa/shared';
import { TRIP_ENDED_NOTICE, TRIP_NOT_FOUND_NOTICE, type HomeNotice } from '../constants/notices';
import { activeTripRoute, type ActiveTripRoute } from './active-trip-route';

export const NOTIFICATION_STALE_AFTER_MS = 5 * 60 * 1000;

export type NotificationTarget =
  | { kind: 'skip' }
  | { kind: 'route'; route: ActiveTripRoute; trip: TripRequestStatus }
  | { kind: 'home'; notice: HomeNotice | null }
  | { kind: 'unavailable'; reason: 'offline' | 'error' };

export interface NotificationTargetApi {
  getActiveTrip: () => Promise<TripRequestStatus | null>;
  getTrip: (tripRequestId: number) => Promise<TripRequestStatus>;
}

export interface ResolveNotificationInput {
  authenticated: boolean;
  rawData: unknown;
  ageMs: number | null;
}

type LookupFailure = 'not_owned_or_missing' | 'offline' | 'error';

const NOT_OWNED_OR_MISSING_STATUSES: readonly number[] = [403, 404];

function classifyLookupFailure(error: unknown): LookupFailure {
  if (typeof error !== 'object' || error === null) return 'error';
  const { kind, status } = error as { kind?: unknown; status?: unknown };
  if (kind === 'network') return 'offline';
  if (kind === 'http' && typeof status === 'number') {
    return NOT_OWNED_OR_MISSING_STATUSES.includes(status) ? 'not_owned_or_missing' : 'error';
  }
  return 'error';
}

export function isNotOwnedOrMissing(error: unknown): boolean {
  return classifyLookupFailure(error) === 'not_owned_or_missing';
}

function unavailable(failure: Exclude<LookupFailure, 'not_owned_or_missing'>): NotificationTarget {
  return { kind: 'unavailable', reason: failure };
}

function resultRoute(trip: TripRequestStatus): ActiveTripRoute | null {
  const params = { id: String(trip.trip_request_id) };
  if (trip.status === 'no_driver') return { pathname: '/searching', params };
  if (trip.status === 'cancelled_by_driver') return { pathname: '/driver-assigned', params };
  return null;
}

function isStale(ageMs: number | null): boolean {
  return ageMs !== null && ageMs > NOTIFICATION_STALE_AFTER_MS;
}

async function lookupActiveTrip(
  api: NotificationTargetApi,
): Promise<{ trip: TripRequestStatus | null } | { failure: LookupFailure }> {
  try {
    return { trip: await api.getActiveTrip() };
  } catch (error) {
    return { failure: classifyLookupFailure(error) };
  }
}

async function lookupHintedTrip(
  api: NotificationTargetApi,
  tripRequestId: number,
): Promise<{ trip: TripRequestStatus } | { failure: LookupFailure }> {
  try {
    return { trip: await api.getTrip(tripRequestId) };
  } catch (error) {
    return { failure: classifyLookupFailure(error) };
  }
}

export async function resolveNotificationTarget(
  api: NotificationTargetApi,
  input: ResolveNotificationInput,
): Promise<NotificationTarget> {
  if (!input.authenticated) return { kind: 'skip' };

  const active = await lookupActiveTrip(api);
  if ('failure' in active) return unavailable(active.failure === 'offline' ? 'offline' : 'error');
  if (active.trip !== null) {
    const route = activeTripRoute(active.trip);
    if (route !== null) return { kind: 'route', route, trip: active.trip };
  }

  const hint = PassengerPushData.safeParse(input.rawData);
  if (!hint.success) return { kind: 'home', notice: null };

  const hinted = await lookupHintedTrip(api, hint.data.trip_request_id);
  if ('failure' in hinted) {
    if (hinted.failure === 'not_owned_or_missing')
      return { kind: 'home', notice: TRIP_NOT_FOUND_NOTICE };
    return unavailable(hinted.failure);
  }

  const route = resultRoute(hinted.trip);
  if (route === null) return { kind: 'home', notice: null };
  if (isStale(input.ageMs)) return { kind: 'home', notice: TRIP_ENDED_NOTICE };
  return { kind: 'route', route, trip: hinted.trip };
}

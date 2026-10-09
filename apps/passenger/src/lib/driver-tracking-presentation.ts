import { driverTrackingView, type DriverTracking } from '@voyyaa/shared';

export type TrackingKind =
  | 'locating'
  | 'live'
  | 'arrived'
  | 'stale'
  | 'unavailable'
  | 'offline'
  | 'refresh_failed'
  | 'resuming';

export type MarkerFreshness = 'live' | 'stale';

export interface TrackingInput {
  tracking: DriverTracking | null;
  elapsedSec: number;
  offline: boolean;
  refreshFailed: boolean;
  resuming: boolean;
  arrived: boolean;
}

export interface TrackingModel {
  kind: TrackingKind;
  marker: { lat: number; lng: number; freshness: MarkerFreshness } | null;
  ageSec: number | null;
}

const AGO_MOMENTS_BELOW_SEC = 20;
const SEC_ROUNDING = 5;
const SEC_PER_MIN = 60;
const MIN_PER_HOUR = 60;

function modelFor(kind: TrackingKind, tracking: DriverTracking, elapsedSec: number) {
  const view = driverTrackingView(tracking, elapsedSec);
  const position = tracking.position;
  const showMarker = position !== null && view !== 'hidden' && view !== 'locating';
  return {
    kind,
    marker: showMarker
      ? { lat: position.lat, lng: position.lng, freshness: view === 'stale' ? 'stale' : 'live' }
      : null,
    ageSec: position === null ? null : position.age_sec + elapsedSec,
  } satisfies TrackingModel;
}

export function trackingModel(input: TrackingInput): TrackingModel | null {
  const { tracking } = input;
  if (tracking === null) return null;

  if (input.resuming) return modelFor('resuming', tracking, 0);

  if (input.offline || input.refreshFailed) {
    const position = tracking.position;
    const hidden = driverTrackingView(tracking, input.elapsedSec) === 'hidden';
    return {
      kind: input.offline ? 'offline' : 'refresh_failed',
      marker:
        position !== null && !hidden
          ? { lat: position.lat, lng: position.lng, freshness: 'stale' }
          : null,
      ageSec: position === null ? null : position.age_sec + input.elapsedSec,
    };
  }

  const view = driverTrackingView(tracking, input.elapsedSec);
  if (view === 'live')
    return modelFor(input.arrived ? 'arrived' : 'live', tracking, input.elapsedSec);
  if (view === 'stale') return modelFor('stale', tracking, input.elapsedSec);
  if (view === 'locating') return modelFor('locating', tracking, input.elapsedSec);
  return modelFor('unavailable', tracking, input.elapsedSec);
}

export type AgoText =
  | { kind: 'moments' }
  | { kind: 'seconds'; value: number }
  | { kind: 'minutes'; value: number }
  | { kind: 'hours'; value: number };

export function agoText(ageSec: number): AgoText {
  const age = Math.max(0, Math.floor(ageSec));
  if (age < AGO_MOMENTS_BELOW_SEC) return { kind: 'moments' };
  if (age < SEC_PER_MIN)
    return { kind: 'seconds', value: Math.floor(age / SEC_ROUNDING) * SEC_ROUNDING };
  const minutes = Math.floor(age / SEC_PER_MIN);
  if (minutes < MIN_PER_HOUR) return { kind: 'minutes', value: minutes };
  return { kind: 'hours', value: Math.floor(minutes / MIN_PER_HOUR) };
}

export type TrackingAnnouncement = 'frozen' | 'back' | 'unavailable' | 'arrived';

export function trackingAnnouncement(
  previous: TrackingKind | null,
  next: TrackingKind,
): TrackingAnnouncement | null {
  if (previous === null || previous === next) return null;
  if (next === 'stale') return 'frozen';
  if (next === 'unavailable') return 'unavailable';
  if (next === 'arrived') return 'arrived';
  const wasDegraded = previous === 'stale' || previous === 'unavailable';
  return next === 'live' && wasDegraded ? 'back' : null;
}

const HOURS_PER_HALF_DAY = 12;

export function formatClockTime(date: Date): string {
  const hours = date.getHours();
  const hour12 = hours % HOURS_PER_HALF_DAY === 0 ? HOURS_PER_HALF_DAY : hours % HOURS_PER_HALF_DAY;
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hour12}:${minutes} ${hours < HOURS_PER_HALF_DAY ? 'a. m.' : 'p. m.'}`;
}

export const SHARING_CAP_MS = 90 * 60 * 1000;
export const SHARING_NO_FIX_INTERVALS = 3;

export type SharingStatus = 'idle' | 'running' | 'capped' | 'precise_needed' | 'failed';
export type StopReason =
  | 'server_signal'
  | 'trip_started'
  | 'forbidden'
  | 'cap'
  | 'precise_lost'
  | 'orphan_cleanup';
export type LocationAccuracy = 'fine' | 'coarse' | 'none' | 'unknown';

export interface SharingTarget {
  trip_request_id: number;
  interval_sec: number;
}

export interface SharingState {
  status: SharingStatus;
  tripRequestId: number | null;
  startedAt: number | null;
}

export type SharingEvent =
  | {
      type: 'home';
      now: number;
      sharing: SharingTarget | null;
      tripStatus: string | null;
      appActive: boolean;
      accuracy: LocationAccuracy;
    }
  | { type: 'report_result'; sharing: SharingTarget | null }
  | { type: 'report_forbidden' }
  | { type: 'tick'; now: number }
  | { type: 'trip_started' }
  | { type: 'start_failed' }
  | { type: 'foreground' }
  | {
      type: 'resume';
      now: number;
      sharing: SharingTarget | null;
      appActive: boolean;
      accuracy: LocationAccuracy;
    };

export type SharingEffect =
  | { type: 'start'; tripRequestId: number; intervalSec: number }
  | { type: 'stop'; reason: StopReason };

export interface SharingTransition {
  state: SharingState;
  effects: SharingEffect[];
}

export const INITIAL_SHARING_STATE: SharingState = {
  status: 'idle',
  tripRequestId: null,
  startedAt: null,
};

const IDLE: SharingState = INITIAL_SHARING_STATE;

function stopped(reason: StopReason): SharingTransition {
  return { state: IDLE, effects: [{ type: 'stop', reason }] };
}

function started(target: SharingTarget, now: number): SharingTransition {
  return {
    state: { status: 'running', tripRequestId: target.trip_request_id, startedAt: now },
    effects: [
      { type: 'start', tripRequestId: target.trip_request_id, intervalSec: target.interval_sec },
    ],
  };
}

function canStart(accuracy: LocationAccuracy): boolean {
  return accuracy === 'fine' || accuracy === 'unknown';
}

function onHome(
  state: SharingState,
  event: Extract<SharingEvent, { type: 'home' }>,
): SharingTransition {
  const { sharing } = event;
  if (sharing === null || event.tripStatus === 'in_progress') {
    return stopped(event.tripStatus === 'in_progress' ? 'trip_started' : 'server_signal');
  }

  if (state.status === 'running') {
    if (sharing.trip_request_id !== state.tripRequestId) {
      const restart = canStart(event.accuracy) && event.appActive;
      const next = restart ? started(sharing, event.now) : { state: IDLE, effects: [] };
      return {
        state: next.state,
        effects: [{ type: 'stop', reason: 'server_signal' }, ...next.effects],
      };
    }
    if (event.accuracy === 'coarse') {
      return {
        state: {
          status: 'precise_needed',
          tripRequestId: sharing.trip_request_id,
          startedAt: null,
        },
        effects: [{ type: 'stop', reason: 'precise_lost' }],
      };
    }
    return { state, effects: [] };
  }

  const holdsSameTrip = state.tripRequestId === sharing.trip_request_id;
  if ((state.status === 'capped' || state.status === 'failed') && holdsSameTrip) {
    return { state, effects: [] };
  }

  if (event.accuracy === 'coarse') {
    return {
      state: { status: 'precise_needed', tripRequestId: sharing.trip_request_id, startedAt: null },
      effects: [],
    };
  }
  if (!canStart(event.accuracy) || !event.appActive) return { state: IDLE, effects: [] };
  return started(sharing, event.now);
}

function onResume(
  state: SharingState,
  event: Extract<SharingEvent, { type: 'resume' }>,
): SharingTransition {
  if (state.status !== 'capped' && state.status !== 'failed') return { state, effects: [] };
  if (event.sharing === null) return { state: IDLE, effects: [] };
  if (event.sharing.trip_request_id !== state.tripRequestId) return { state, effects: [] };
  if (!event.appActive || !canStart(event.accuracy)) return { state, effects: [] };
  return started(event.sharing, event.now);
}

export function sharingReducer(state: SharingState, event: SharingEvent): SharingTransition {
  switch (event.type) {
    case 'home':
      return onHome(state, event);
    case 'resume':
      return onResume(state, event);
    case 'report_result':
      return event.sharing === null ? stopped('server_signal') : { state, effects: [] };
    case 'report_forbidden':
      return stopped('forbidden');
    case 'trip_started':
      return stopped('trip_started');
    case 'start_failed':
      return {
        state: { status: 'failed', tripRequestId: state.tripRequestId, startedAt: null },
        effects: [],
      };
    case 'foreground':
      return state.status === 'failed' ? { state: IDLE, effects: [] } : { state, effects: [] };
    case 'tick': {
      const due =
        state.status === 'running' &&
        state.startedAt !== null &&
        event.now - state.startedAt >= SHARING_CAP_MS;
      if (!due) return { state, effects: [] };
      return {
        state: { status: 'capped', tripRequestId: state.tripRequestId, startedAt: null },
        effects: [{ type: 'stop', reason: 'cap' }],
      };
    }
  }
}

export function remainingCapMs(state: SharingState, now: number): number | null {
  if (state.status !== 'running' || state.startedAt === null) return null;
  return Math.max(0, SHARING_CAP_MS - (now - state.startedAt));
}

export interface Reading {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: number;
}

export function pickReportableReading(
  readings: readonly Reading[],
  maxAccuracyM: number,
): Reading | null {
  let best: Reading | null = null;
  for (const reading of readings) {
    const usable = reading.accuracy !== null && reading.accuracy <= maxAccuracyM;
    if (usable && (best === null || reading.timestamp >= best.timestamp)) best = reading;
  }
  return best;
}

export type LocationIssue = 'permission_denied' | 'gps_disabled' | 'consent_required' | null;

export interface SharingIndicatorInput {
  status: SharingStatus;
  sharing: SharingTarget | null;
  locationIssue: LocationIssue;
  silentForSec: number;
  offline: boolean;
}

export type SharingIndicator =
  | { kind: 'none' }
  | { kind: 'consent_required' }
  | { kind: 'location_issue'; issue: 'permission_denied' | 'gps_disabled' }
  | { kind: 'precise_needed' }
  | { kind: 'no_fix' }
  | { kind: 'offline' }
  | { kind: 'capped' }
  | { kind: 'active' };

export function deriveSharingIndicator(input: SharingIndicatorInput): SharingIndicator {
  if (input.locationIssue === 'consent_required') return { kind: 'consent_required' };
  if (input.locationIssue === 'permission_denied' || input.locationIssue === 'gps_disabled') {
    return { kind: 'location_issue', issue: input.locationIssue };
  }
  if (input.sharing === null && input.status === 'idle') return { kind: 'none' };
  if (input.status === 'precise_needed') return { kind: 'precise_needed' };
  if (input.status === 'capped') return { kind: 'capped' };
  if (input.status === 'failed') return { kind: 'no_fix' };
  if (input.status !== 'running') return { kind: 'none' };
  const noFixAfterSec =
    (input.sharing?.interval_sec ?? 0) * SHARING_NO_FIX_INTERVALS || Number.POSITIVE_INFINITY;
  if (input.silentForSec > noFixAfterSec) return { kind: 'no_fix' };
  if (input.offline) return { kind: 'offline' };
  return { kind: 'active' };
}

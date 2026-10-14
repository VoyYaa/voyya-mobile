import type { NotificationTarget } from './notification-target';

export type NotificationTapPhase = 'idle' | 'resolving' | 'offline' | 'error';

export type TapOrigin = 'cold' | 'background';

export type TapFailure = 'offline' | 'error';

export interface PendingTap {
  rawData: unknown;
  ageMs: number | null;
  origin: TapOrigin;
}

export interface TapState {
  pending: PendingTap | null;
  failure: TapFailure | null;
  waitingForNetwork: boolean;
  attempt: number;
}

export type TapEvent =
  | { type: 'tapped'; tap: PendingTap }
  | {
      type: 'resolved';
      target: NotificationTarget;
      networkOffline: boolean;
      startupRestored?: boolean;
    }
  | { type: 'network_restored' }
  | { type: 'retry' }
  | { type: 'skip' }
  | { type: 'session_ended' };

export const INITIAL_TAP_STATE: TapState = {
  pending: null,
  failure: null,
  waitingForNetwork: false,
  attempt: 0,
};

function afterResolution(
  state: TapState,
  event: { target: NotificationTarget; networkOffline: boolean; startupRestored?: boolean },
): TapState {
  const { target, networkOffline, startupRestored = false } = event;
  if (target.kind !== 'unavailable') {
    return { ...state, pending: null, failure: null, waitingForNetwork: false };
  }
  const keepScreen =
    startupRestored ||
    (state.pending?.origin === 'background' && target.reason === 'offline' && networkOffline);
  if (keepScreen) return { ...state, waitingForNetwork: true };
  return { ...state, failure: target.reason };
}

function rerun(state: TapState): TapState {
  return { ...state, failure: null, waitingForNetwork: false, attempt: state.attempt + 1 };
}

export function tapReducer(state: TapState, event: TapEvent): TapState {
  switch (event.type) {
    case 'tapped':
      return { ...state, pending: event.tap, failure: null, waitingForNetwork: false };
    case 'resolved':
      return state.pending === null ? state : afterResolution(state, event);
    case 'network_restored':
      return state.pending !== null && (state.failure === 'offline' || state.waitingForNetwork)
        ? rerun(state)
        : state;
    case 'retry':
      return state.pending === null ? state : rerun(state);
    case 'skip':
      return { ...INITIAL_TAP_STATE, attempt: state.attempt + 1 };
    case 'session_ended':
      return { ...INITIAL_TAP_STATE, attempt: state.attempt + 1 };
  }
}

export function tapPhase(state: TapState): NotificationTapPhase {
  if (state.failure !== null) return state.failure;
  const resolving = state.pending !== null && !state.waitingForNetwork;
  return resolving ? 'resolving' : 'idle';
}

export interface ResolveContext {
  authenticated: boolean;
  hydrating: boolean;
  startupSettled: boolean;
}

export function canResolveTap(state: TapState, context: ResolveContext): boolean {
  if (state.pending === null || state.failure !== null || state.waitingForNetwork) return false;
  if (context.hydrating) return false;
  return context.authenticated && context.startupSettled;
}

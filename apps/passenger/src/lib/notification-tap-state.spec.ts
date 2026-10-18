import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  INITIAL_TAP_STATE,
  canResolveTap,
  tapPhase,
  tapReducer,
  type PendingTap,
  type TapEvent,
  type TapState,
} from './notification-tap-state.ts';

const cold: PendingTap = { rawData: { type: 'trip_no_driver' }, ageMs: 100, origin: 'cold' };
const background: PendingTap = { ...cold, origin: 'background' };

function run(events: readonly TapEvent[], from: TapState = INITIAL_TAP_STATE): TapState {
  return events.reduce(tapReducer, from);
}

const offlineTarget = { kind: 'unavailable', reason: 'offline' } as const;
const errorTarget = { kind: 'unavailable', reason: 'error' } as const;

describe('tapReducer', () => {
  it('starts idle, with no tap pending', () => {
    assert.equal(tapPhase(INITIAL_TAP_STATE), 'idle');
  });

  it('shows a single loader as soon as a tap is pending, before the server answers', () => {
    const state = run([{ type: 'tapped', tap: cold }]);
    assert.equal(tapPhase(state), 'resolving');
    assert.deepEqual(state.pending, cold);
  });

  it('goes back to idle once the target is resolved, whatever it is', () => {
    for (const kind of ['skip', 'route', 'home'] as const) {
      const target =
        kind === 'home'
          ? ({ kind, notice: null } as const)
          : kind === 'skip'
            ? ({ kind } as const)
            : ({ kind, route: { pathname: '/searching', params: { id: '1' } }, trip: {} } as never);
      const state = run([
        { type: 'tapped', tap: cold },
        { type: 'resolved', target, networkOffline: false },
      ]);
      assert.equal(tapPhase(state), 'idle', kind);
      assert.equal(state.pending, null, kind);
    }
  });

  it('shows the offline state with retry when a cold start has no connection', () => {
    const state = run([
      { type: 'tapped', tap: cold },
      { type: 'resolved', target: offlineTarget, networkOffline: true },
    ]);
    assert.equal(tapPhase(state), 'offline');
    assert.notEqual(state.pending, null);
  });

  it('keeps the screen as is when a background tap has no connection, and waits for it', () => {
    const state = run([
      { type: 'tapped', tap: background },
      { type: 'resolved', target: offlineTarget, networkOffline: true },
    ]);
    assert.equal(tapPhase(state), 'idle');
    assert.equal(state.waitingForNetwork, true);
    assert.notEqual(state.pending, null);
  });

  it('shows the offline state when a background tap failed on the network but the phone says it is online', () => {
    const state = run([
      { type: 'tapped', tap: background },
      { type: 'resolved', target: offlineTarget, networkOffline: false },
    ]);
    assert.equal(tapPhase(state), 'offline');
  });

  it('shows the error state with retry for a server failure, from any origin', () => {
    for (const tap of [cold, background]) {
      const state = run([
        { type: 'tapped', tap },
        { type: 'resolved', target: errorTarget, networkOffline: false },
      ]);
      assert.equal(tapPhase(state), 'error', tap.origin);
    }
  });

  it('resolves again when the connection comes back, for both waiting and offline', () => {
    const waiting = run([
      { type: 'tapped', tap: background },
      { type: 'resolved', target: offlineTarget, networkOffline: true },
      { type: 'network_restored' },
    ]);
    assert.equal(tapPhase(waiting), 'resolving');
    assert.equal(waiting.waitingForNetwork, false);

    const offline = run([
      { type: 'tapped', tap: cold },
      { type: 'resolved', target: offlineTarget, networkOffline: true },
      { type: 'network_restored' },
    ]);
    assert.equal(tapPhase(offline), 'resolving');
    assert.equal(offline.failure, null);
  });

  it('does not retry a server error just because the connection came back', () => {
    const state = run([
      { type: 'tapped', tap: cold },
      { type: 'resolved', target: errorTarget, networkOffline: false },
      { type: 'network_restored' },
    ]);
    assert.equal(tapPhase(state), 'error');
  });

  it('ignores a connection change while the tap is already being resolved', () => {
    const resolving = run([{ type: 'tapped', tap: cold }]);
    assert.deepEqual(run([{ type: 'network_restored' }], resolving), resolving);
    assert.deepEqual(run([{ type: 'network_restored' }]), INITIAL_TAP_STATE);
  });

  it('bumps the attempt on every retry so the resolution runs again', () => {
    const failed = run([
      { type: 'tapped', tap: cold },
      { type: 'resolved', target: errorTarget, networkOffline: false },
    ]);
    const retried = run([{ type: 'retry' }], failed);
    assert.equal(tapPhase(retried), 'resolving');
    assert.equal(retried.attempt, failed.attempt + 1);
  });

  it('drops the pending tap when the passenger continues to home', () => {
    const state = run([
      { type: 'tapped', tap: cold },
      { type: 'resolved', target: errorTarget, networkOffline: false },
      { type: 'skip' },
    ]);
    assert.deepEqual(state, { ...INITIAL_TAP_STATE, attempt: state.attempt });
    assert.equal(tapPhase(state), 'idle');
  });

  it('forgets the tap when the session ends, so nothing of the notification survives a logout', () => {
    const state = run([{ type: 'tapped', tap: cold }, { type: 'session_ended' }]);
    assert.equal(state.pending, null);
    assert.equal(tapPhase(state), 'idle');
  });

  it('replaces an older tap with a newer one and clears the previous failure', () => {
    const state = run([
      { type: 'tapped', tap: cold },
      { type: 'resolved', target: errorTarget, networkOffline: false },
      { type: 'tapped', tap: background },
    ]);
    assert.equal(tapPhase(state), 'resolving');
    assert.equal(state.failure, null);
    assert.deepEqual(state.pending, background);
  });

  it('ignores a resolution that arrives when nothing is pending', () => {
    const state = run([{ type: 'resolved', target: errorTarget, networkOffline: false }]);
    assert.deepEqual(state, INITIAL_TAP_STATE);
  });
});

describe('tapReducer with the startup already restored from the saved code (U-09)', () => {
  const restoredOffline = {
    type: 'resolved',
    target: offlineTarget,
    networkOffline: true,
    startupRestored: true,
  } as const;
  const restoredError = {
    type: 'resolved',
    target: errorTarget,
    networkOffline: false,
    startupRestored: true,
  } as const;

  it('waits for the network in silence when a cold tap cannot be resolved without a connection', () => {
    const state = run([{ type: 'tapped', tap: cold }, restoredOffline]);
    assert.equal(tapPhase(state), 'idle');
    assert.equal(state.waitingForNetwork, true);
    assert.equal(state.failure, null);
    assert.notEqual(state.pending, null);
  });

  it('waits in silence for a server failure too, instead of showing the failure panel over the code', () => {
    for (const tap of [cold, background]) {
      const state = run([{ type: 'tapped', tap }, restoredError]);
      assert.equal(tapPhase(state), 'idle', tap.origin);
      assert.equal(state.waitingForNetwork, true, tap.origin);
      assert.equal(state.failure, null, tap.origin);
    }
  });

  it('resolves again when the connection comes back', () => {
    const state = run([
      { type: 'tapped', tap: cold },
      restoredOffline,
      { type: 'network_restored' },
    ]);
    assert.equal(tapPhase(state), 'resolving');
    assert.equal(state.waitingForNetwork, false);
    assert.equal(state.attempt, 1);
  });

  it('never resolves while it waits, so it cannot loop without the network', () => {
    const state = run([{ type: 'tapped', tap: cold }, restoredOffline]);
    assert.equal(
      canResolveTap(state, { authenticated: true, hydrating: false, startupSettled: true }),
      false,
    );
  });

  it('still clears the tap when the target resolves to a route', () => {
    const target = {
      kind: 'route',
      route: { pathname: '/driver-assigned', params: { id: '1' } },
      trip: {},
    } as never;
    const state = run([
      { type: 'tapped', tap: cold },
      { type: 'resolved', target, networkOffline: false, startupRestored: true },
    ]);
    assert.equal(state.pending, null);
    assert.equal(tapPhase(state), 'idle');
  });

  it('keeps today behaviour when the startup was not restored', () => {
    const state = run([
      { type: 'tapped', tap: cold },
      { type: 'resolved', target: offlineTarget, networkOffline: true, startupRestored: false },
    ]);
    assert.equal(tapPhase(state), 'offline');
    assert.equal(state.waitingForNetwork, false);
  });

  it('forgets the waiting tap when the session ends', () => {
    const state = run([{ type: 'tapped', tap: cold }, restoredOffline, { type: 'session_ended' }]);
    assert.equal(state.pending, null);
    assert.equal(state.waitingForNetwork, false);
  });
});

describe('canResolveTap', () => {
  const ready = {
    authenticated: true,
    hydrating: false,
    startupSettled: true,
  };
  const pendingState: TapState = { ...INITIAL_TAP_STATE, pending: cold };

  it('resolves once there is a session and the startup check finished', () => {
    assert.equal(canResolveTap(pendingState, ready), true);
  });

  it('waits for the startup check, so there is a single loader on a cold start', () => {
    assert.equal(canResolveTap(pendingState, { ...ready, startupSettled: false }), false);
  });

  it('waits while the session is being restored', () => {
    assert.equal(
      canResolveTap(pendingState, { authenticated: false, hydrating: true, startupSettled: true }),
      false,
    );
  });

  it('never resolves without a session', () => {
    assert.equal(canResolveTap(pendingState, { ...ready, authenticated: false }), false);
  });

  it('does not resolve with nothing pending, while failed, or while waiting for the network', () => {
    assert.equal(canResolveTap(INITIAL_TAP_STATE, ready), false);
    assert.equal(canResolveTap({ ...pendingState, failure: 'error' }, ready), false);
    assert.equal(canResolveTap({ ...pendingState, waitingForNetwork: true }, ready), false);
  });
});

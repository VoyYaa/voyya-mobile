import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  INITIAL_SHARING_STATE,
  SHARING_CAP_MS,
  deriveSharingIndicator,
  pickReportableReading,
  remainingCapMs,
  sharingReducer,
  type SharingEvent,
  type SharingState,
  type SharingTarget,
} from './sharing-machine.ts';

const TARGET: SharingTarget = { trip_request_id: 11, interval_sec: 15 };
const T0 = 1_000_000;

function home(overrides: Partial<Extract<SharingEvent, { type: 'home' }>> = {}): SharingEvent {
  return {
    type: 'home',
    now: T0,
    sharing: TARGET,
    tripStatus: 'assigned',
    appActive: true,
    accuracy: 'fine',
    ...overrides,
  };
}

const RUNNING: SharingState = { status: 'running', tripRequestId: 11, startedAt: T0 };

describe('sharingReducer start', () => {
  it('starts when the server says the trip is in the window and the app is visible', () => {
    const { state, effects } = sharingReducer(INITIAL_SHARING_STATE, home());
    assert.deepEqual(state, { status: 'running', tripRequestId: 11, startedAt: T0 });
    assert.deepEqual(effects, [{ type: 'start', tripRequestId: 11, intervalSec: 15 }]);
  });

  it('waits for the app to be visible: Android only allows starting the service in the foreground', () => {
    const { state, effects } = sharingReducer(INITIAL_SHARING_STATE, home({ appActive: false }));
    assert.equal(state.status, 'idle');
    assert.deepEqual(effects, []);
  });

  it('does not start without a server signal and stops any task the system restored', () => {
    const { state, effects } = sharingReducer(INITIAL_SHARING_STATE, home({ sharing: null }));
    assert.equal(state.status, 'idle');
    assert.deepEqual(effects, [{ type: 'stop', reason: 'server_signal' }]);
  });

  it('N1: does not start with approximate permission and asks for the precise one', () => {
    const { state, effects } = sharingReducer(INITIAL_SHARING_STATE, home({ accuracy: 'coarse' }));
    assert.equal(state.status, 'precise_needed');
    assert.deepEqual(effects, []);
  });

  it('starts once the permission becomes precise', () => {
    const waiting = sharingReducer(INITIAL_SHARING_STATE, home({ accuracy: 'coarse' })).state;
    const { state, effects } = sharingReducer(waiting, home({ now: T0 + 5 }));
    assert.equal(state.status, 'running');
    assert.equal(effects.length, 1);
  });

  it('does not start without a location permission at all', () => {
    const { state } = sharingReducer(INITIAL_SHARING_STATE, home({ accuracy: 'none' }));
    assert.equal(state.status, 'idle');
  });

  it('ignores repeated home reads while running', () => {
    const { state, effects } = sharingReducer(RUNNING, home({ now: T0 + 4000 }));
    assert.deepEqual(state, RUNNING);
    assert.deepEqual(effects, []);
  });

  it('moves to the new trip when the server points to another one', () => {
    const other: SharingTarget = { trip_request_id: 12, interval_sec: 10 };
    const { state, effects } = sharingReducer(RUNNING, home({ sharing: other, now: T0 + 1 }));
    assert.equal(state.tripRequestId, 12);
    assert.deepEqual(effects, [
      { type: 'stop', reason: 'server_signal' },
      { type: 'start', tripRequestId: 12, intervalSec: 10 },
    ]);
  });
});

describe('sharingReducer stops', () => {
  it('stops with the server signal on the next report', () => {
    const { state, effects } = sharingReducer(RUNNING, { type: 'report_result', sharing: null });
    assert.equal(state.status, 'idle');
    assert.deepEqual(effects, [{ type: 'stop', reason: 'server_signal' }]);
  });

  it('keeps going while the server keeps answering with a window', () => {
    const { state, effects } = sharingReducer(RUNNING, { type: 'report_result', sharing: TARGET });
    assert.deepEqual(state, RUNNING);
    assert.deepEqual(effects, []);
  });

  it('stops when the trip is started', () => {
    const { effects } = sharingReducer(RUNNING, { type: 'trip_started' });
    assert.deepEqual(effects, [{ type: 'stop', reason: 'trip_started' }]);
    const viaHome = sharingReducer(RUNNING, home({ tripStatus: 'in_progress' }));
    assert.deepEqual(viaHome.effects, [{ type: 'stop', reason: 'trip_started' }]);
  });

  it('stops when the server rejects the report with 403', () => {
    const { state, effects } = sharingReducer(RUNNING, { type: 'report_forbidden' });
    assert.equal(state.status, 'idle');
    assert.deepEqual(effects, [{ type: 'stop', reason: 'forbidden' }]);
  });

  it('stops when the window disappears from the home read', () => {
    const { effects } = sharingReducer(RUNNING, home({ sharing: null }));
    assert.deepEqual(effects, [{ type: 'stop', reason: 'server_signal' }]);
  });

  it('stops if the permission drops to approximate while running', () => {
    const { state, effects } = sharingReducer(RUNNING, home({ accuracy: 'coarse' }));
    assert.equal(state.status, 'precise_needed');
    assert.deepEqual(effects, [{ type: 'stop', reason: 'precise_lost' }]);
  });

  it('still stops when idle: a task restored after the process died is orphaned', () => {
    const expected = [
      [{ type: 'report_result', sharing: null }, 'server_signal'],
      [{ type: 'report_forbidden' }, 'forbidden'],
      [{ type: 'trip_started' }, 'trip_started'],
      [home({ sharing: null }), 'server_signal'],
      [home({ sharing: null, tripStatus: 'in_progress' }), 'trip_started'],
    ] as const;
    for (const [event, reason] of expected) {
      const next = sharingReducer(INITIAL_SHARING_STATE, event);
      assert.equal(next.state.status, 'idle');
      assert.deepEqual(next.effects, [{ type: 'stop', reason }]);
    }
  });

  it('does not stop when idle for events that carry no stop signal', () => {
    assert.deepEqual(sharingReducer(INITIAL_SHARING_STATE, { type: 'foreground' }).effects, []);
    assert.deepEqual(
      sharingReducer(INITIAL_SHARING_STATE, { type: 'tick', now: T0 }).effects,
      [],
    );
  });
});

describe('the 90 minute cap', () => {
  it('stops exactly at 90 minutes and not before', () => {
    const before = sharingReducer(RUNNING, { type: 'tick', now: T0 + SHARING_CAP_MS - 1 });
    assert.equal(before.state.status, 'running');
    const at = sharingReducer(RUNNING, { type: 'tick', now: T0 + SHARING_CAP_MS });
    assert.equal(at.state.status, 'capped');
    assert.deepEqual(at.effects, [{ type: 'stop', reason: 'cap' }]);
  });

  it('never restarts by itself while the same trip is still in the window', () => {
    const capped = sharingReducer(RUNNING, { type: 'tick', now: T0 + SHARING_CAP_MS }).state;
    for (let i = 1; i <= 5; i += 1) {
      const next = sharingReducer(capped, home({ now: T0 + SHARING_CAP_MS + i * 4000 }));
      assert.equal(next.state.status, 'capped');
      assert.deepEqual(next.effects, []);
    }
  });

  it('restarts only on the explicit resume, with a new cap, when the server still has a window', () => {
    const capped = sharingReducer(RUNNING, { type: 'tick', now: T0 + SHARING_CAP_MS }).state;
    const now = T0 + SHARING_CAP_MS + 60_000;
    const resumed = sharingReducer(capped, {
      type: 'resume',
      now,
      sharing: TARGET,
      appActive: true,
      accuracy: 'fine',
    });
    assert.deepEqual(resumed.state, { status: 'running', tripRequestId: 11, startedAt: now });
    assert.deepEqual(resumed.effects, [{ type: 'start', tripRequestId: 11, intervalSec: 15 }]);
  });

  it('does not restart on resume when the server no longer has a window', () => {
    const capped = sharingReducer(RUNNING, { type: 'tick', now: T0 + SHARING_CAP_MS }).state;
    const resumed = sharingReducer(capped, {
      type: 'resume',
      now: T0 + SHARING_CAP_MS + 1,
      sharing: null,
      appActive: true,
      accuracy: 'fine',
    });
    assert.equal(resumed.state.status, 'idle');
    assert.deepEqual(resumed.effects, []);
  });

  it('ignores a resume that was not requested after a cap', () => {
    const resumed = sharingReducer(RUNNING, {
      type: 'resume',
      now: T0 + 1,
      sharing: TARGET,
      appActive: true,
      accuracy: 'fine',
    });
    assert.deepEqual(resumed.state, RUNNING);
    assert.deepEqual(resumed.effects, []);
  });

  it('forgets the cap when the window closes, so the next trip starts normally', () => {
    const capped = sharingReducer(RUNNING, { type: 'tick', now: T0 + SHARING_CAP_MS }).state;
    const closed = sharingReducer(capped, home({ sharing: null })).state;
    assert.equal(closed.status, 'idle');
    const next = sharingReducer(
      closed,
      home({ sharing: { trip_request_id: 20, interval_sec: 15 } }),
    );
    assert.equal(next.state.status, 'running');
  });

  it('reports how much of the cap is left', () => {
    assert.equal(remainingCapMs(RUNNING, T0 + 1000), SHARING_CAP_MS - 1000);
    assert.equal(remainingCapMs(RUNNING, T0 + SHARING_CAP_MS * 2), 0);
    assert.equal(remainingCapMs(INITIAL_SHARING_STATE, T0), null);
  });
});

describe('a start that the system refuses', () => {
  it('does not loop: it stays failed for the same trip until the app returns to the foreground', () => {
    const running = sharingReducer(INITIAL_SHARING_STATE, home()).state;
    const failed = sharingReducer(running, { type: 'start_failed' }).state;
    assert.equal(failed.status, 'failed');
    for (let i = 1; i <= 3; i += 1) {
      const next = sharingReducer(failed, home({ now: T0 + i * 4000 }));
      assert.equal(next.state.status, 'failed');
      assert.deepEqual(next.effects, []);
    }
    const back = sharingReducer(failed, { type: 'foreground' }).state;
    assert.equal(back.status, 'idle');
    assert.equal(sharingReducer(back, home()).state.status, 'running');
  });

  it('shows the no-signal indicator while failed', () => {
    assert.deepEqual(
      deriveSharingIndicator({
        status: 'failed',
        sharing: TARGET,
        locationIssue: null,
        silentForSec: 0,
        offline: false,
      }),
      { kind: 'no_fix' },
    );
  });
});

describe('pickReportableReading', () => {
  const reading = (accuracy: number | null, timestamp: number) => ({
    latitude: 6.96,
    longitude: -75.41,
    accuracy,
    timestamp,
  });

  it('takes the latest reading of the batch', () => {
    const picked = pickReportableReading([reading(20, 1), reading(30, 3), reading(10, 2)], 100);
    assert.equal(picked?.timestamp, 3);
  });

  it('discards readings worse than 100 meters', () => {
    const picked = pickReportableReading([reading(40, 1), reading(250, 5)], 100);
    assert.equal(picked?.timestamp, 1);
    assert.equal(pickReportableReading([reading(101, 1)], 100), null);
    assert.equal(pickReportableReading([reading(100, 1)], 100)?.timestamp, 1);
  });

  it('discards readings without an accuracy and empty batches', () => {
    assert.equal(pickReportableReading([reading(null, 1)], 100), null);
    assert.equal(pickReportableReading([], 100), null);
  });
});

describe('deriveSharingIndicator', () => {
  const base = {
    status: 'running' as const,
    sharing: TARGET,
    locationIssue: null,
    silentForSec: 5,
    offline: false,
  };

  it('7: shows the normal state while sharing', () => {
    assert.deepEqual(deriveSharingIndicator(base), { kind: 'active' });
  });

  it('shows nothing when there is no window', () => {
    assert.deepEqual(deriveSharingIndicator({ ...base, status: 'idle', sharing: null }), {
      kind: 'none',
    });
  });

  it('keeps surfacing a location problem outside the window', () => {
    assert.deepEqual(
      deriveSharingIndicator({
        ...base,
        status: 'idle',
        sharing: null,
        locationIssue: 'permission_denied',
      }),
      { kind: 'location_issue', issue: 'permission_denied' },
    );
  });

  it('1: consent required wins over everything', () => {
    assert.deepEqual(
      deriveSharingIndicator({ ...base, locationIssue: 'consent_required', offline: true }),
      { kind: 'consent_required' },
    );
  });

  it('2: permission and GPS problems come next', () => {
    assert.deepEqual(deriveSharingIndicator({ ...base, locationIssue: 'gps_disabled' }), {
      kind: 'location_issue',
      issue: 'gps_disabled',
    });
  });

  it('3: approximate permission', () => {
    assert.deepEqual(deriveSharingIndicator({ ...base, status: 'precise_needed' }), {
      kind: 'precise_needed',
    });
  });

  it('4: no GPS fix after three intervals, derived from the server interval', () => {
    assert.deepEqual(deriveSharingIndicator({ ...base, silentForSec: 45 }), { kind: 'active' });
    assert.deepEqual(deriveSharingIndicator({ ...base, silentForSec: 46 }), { kind: 'no_fix' });
    assert.deepEqual(
      deriveSharingIndicator({
        ...base,
        sharing: { trip_request_id: 11, interval_sec: 10 },
        silentForSec: 31,
      }),
      { kind: 'no_fix' },
    );
  });

  it('5: offline while readings still arrive', () => {
    assert.deepEqual(deriveSharingIndicator({ ...base, offline: true }), { kind: 'offline' });
  });

  it('6: the cap', () => {
    assert.deepEqual(deriveSharingIndicator({ ...base, status: 'capped' }), { kind: 'capped' });
  });
});

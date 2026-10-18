import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { TripRequestStatus } from '@voyyaa/shared';

import {
  resolveColdStart,
  serverProbe,
  startupPhaseOf,
  type ColdStartInput,
  type ServerProbe,
} from './cold-start.ts';
import {
  START_CODE_RECORD_VERSION,
  type RecordProbe,
  type StartCodeRecord,
} from './start-code-record.ts';

const TTL = 6 * 60 * 60 * 1000;
const NOW = 1_800_000_000_000;
const USER = 7;

function record(overrides: Partial<StartCodeRecord> = {}): StartCodeRecord {
  return {
    version: START_CODE_RECORD_VERSION,
    trip_request_id: 41,
    user_id: USER,
    start_code: '4821',
    saved_at: NOW - 1000,
    ...overrides,
  };
}

function present(overrides: Partial<StartCodeRecord> = {}): RecordProbe {
  return { kind: 'present', record: record(overrides) };
}

const trip = { trip_request_id: 41, status: 'assigned' } as TripRequestStatus;

function input(overrides: Partial<ColdStartInput> = {}): ColdStartInput {
  return {
    session: 'authenticated',
    userId: USER,
    server: { kind: 'pending' },
    record: present(),
    slowSignal: false,
    now: NOW,
    ttlMs: TTL,
    ...overrides,
  };
}

const offline: ServerProbe = { kind: 'failed', reason: 'offline' };
const failedWithError: ServerProbe = { kind: 'failed', reason: 'error' };

describe('serverProbe', () => {
  const base = { data: undefined, isError: false, networkError: false, offline: false };

  it('is answered as soon as there is data, even a missing trip', () => {
    assert.deepEqual(serverProbe({ ...base, data: trip }), { kind: 'answered', trip });
    assert.deepEqual(serverProbe({ ...base, data: null }), { kind: 'answered', trip: null });
  });

  it('keeps the data even when a later refresh failed', () => {
    assert.deepEqual(serverProbe({ ...base, data: trip, isError: true, offline: true }), {
      kind: 'answered',
      trip,
    });
  });

  it('is offline when the phone says it has no network and nothing has answered', () => {
    assert.deepEqual(serverProbe({ ...base, offline: true }), offline);
  });

  it('is offline for a network error, which includes the timeout', () => {
    assert.deepEqual(serverProbe({ ...base, isError: true, networkError: true }), offline);
  });

  it('is an error for any other failure: 5xx, 429 or a response that does not validate', () => {
    assert.deepEqual(serverProbe({ ...base, isError: true }), failedWithError);
  });

  it('is pending while it waits', () => {
    assert.deepEqual(serverProbe(base), { kind: 'pending' });
  });
});

describe('resolveColdStart', () => {
  describe('rule 1: without a session', () => {
    it('1a: does nothing while the session is being restored, and discards nothing', () => {
      const result = resolveColdStart(input({ session: 'hydrating' }));
      assert.deepEqual(result, { decision: { kind: 'idle' }, discardRecord: false });
    });

    it('1b: with no session, a record on disk is discarded (C-6)', () => {
      for (const probe of [present(), present({ user_id: 99 }), { kind: 'invalid' } as const]) {
        const result = resolveColdStart(input({ session: 'guest', userId: null, record: probe }));
        assert.deepEqual(result, { decision: { kind: 'idle' }, discardRecord: true });
      }
    });

    it('1b: with no session and nothing saved, there is nothing to discard', () => {
      for (const probe of [{ kind: 'absent' }, { kind: 'loading' }] as const) {
        const result = resolveColdStart(input({ session: 'guest', userId: null, record: probe }));
        assert.deepEqual(result, { decision: { kind: 'idle' }, discardRecord: false });
      }
    });
  });

  describe('rule 2: the server answered', () => {
    it('goes with the server and never uses the record, however fast or valid it is', () => {
      const answered: ServerProbe = { kind: 'answered', trip };
      const result = resolveColdStart(input({ server: answered }));
      assert.deepEqual(result, { decision: { kind: 'server', trip }, discardRecord: false });
    });

    it('goes with the server when it says there is no trip, and leaves the clean-up to the reconciler', () => {
      const result = resolveColdStart(input({ server: { kind: 'answered', trip: null } }));
      assert.deepEqual(result, { decision: { kind: 'server', trip: null }, discardRecord: false });
    });

    it('answers before 4 seconds never restore, even with a valid record', () => {
      const result = resolveColdStart(
        input({ server: { kind: 'answered', trip }, slowSignal: false }),
      );
      assert.equal(result.decision.kind, 'server');
    });

    it('answers after 4 seconds still win over the record', () => {
      const result = resolveColdStart(
        input({ server: { kind: 'answered', trip }, slowSignal: true }),
      );
      assert.equal(result.decision.kind, 'server');
    });
  });

  describe('rule 3: still waiting, and not slow yet', () => {
    it('waits', () => {
      const result = resolveColdStart(input({ server: { kind: 'pending' }, slowSignal: false }));
      assert.deepEqual(result, { decision: { kind: 'wait' }, discardRecord: false });
    });

    it('waits even with an expired record, without discarding it yet', () => {
      const result = resolveColdStart(input({ record: present({ saved_at: NOW - TTL }) }));
      assert.deepEqual(result, { decision: { kind: 'wait' }, discardRecord: false });
    });
  });

  describe('rule 4: the record is still loading', () => {
    it('waits for it, with or without a server failure', () => {
      for (const server of [offline, failedWithError, { kind: 'pending' } as const]) {
        const result = resolveColdStart(
          input({ server, record: { kind: 'loading' }, slowSignal: true }),
        );
        assert.deepEqual(result, { decision: { kind: 'wait' }, discardRecord: false });
      }
    });
  });

  describe('rule 5: a valid record and no answer from the server', () => {
    it('restores offline when there is no network', () => {
      const result = resolveColdStart(input({ server: offline }));
      assert.deepEqual(result, {
        decision: { kind: 'restore', record: record(), mode: 'offline' },
        discardRecord: false,
      });
    });

    it('restores with the error mode when the server answered 5xx', () => {
      const result = resolveColdStart(input({ server: failedWithError }));
      assert.deepEqual(result, {
        decision: { kind: 'restore', record: record(), mode: 'error' },
        discardRecord: false,
      });
    });

    it('restores in checking mode when it has waited 4 seconds without an answer', () => {
      const result = resolveColdStart(input({ server: { kind: 'pending' }, slowSignal: true }));
      assert.deepEqual(result, {
        decision: { kind: 'restore', record: record(), mode: 'checking' },
        discardRecord: false,
      });
    });

    it('still honours a record saved a millisecond before it expires', () => {
      const result = resolveColdStart(
        input({ server: offline, record: present({ saved_at: NOW - TTL + 1 }) }),
      );
      assert.equal(result.decision.kind, 'restore');
    });
  });

  describe('rule 6: a record that cannot be used', () => {
    const unusable: readonly [string, RecordProbe][] = [
      ['of another user', present({ user_id: 99 })],
      ['expired', present({ saved_at: NOW - TTL })],
      ['from the future', present({ saved_at: NOW + 1 })],
      ['invalid', { kind: 'invalid' }],
    ];

    for (const [name, probe] of unusable) {
      it(`${name}: is discarded and the usual gate is shown when the server failed`, () => {
        for (const reason of ['offline', 'error'] as const) {
          const result = resolveColdStart(
            input({ server: { kind: 'failed', reason }, record: probe }),
          );
          assert.deepEqual(result, { decision: { kind: 'failed', reason }, discardRecord: true });
        }
      });

      it(`${name}: is discarded and it keeps waiting when the server is still silent after 4 s`, () => {
        const result = resolveColdStart(
          input({ server: { kind: 'pending' }, record: probe, slowSignal: true }),
        );
        assert.deepEqual(result, { decision: { kind: 'wait' }, discardRecord: true });
      });
    }
  });

  describe('rule 7: nothing saved', () => {
    it('shows the usual gate, untouched, when the server failed', () => {
      for (const reason of ['offline', 'error'] as const) {
        const result = resolveColdStart(
          input({ server: { kind: 'failed', reason }, record: { kind: 'absent' } }),
        );
        assert.deepEqual(result, { decision: { kind: 'failed', reason }, discardRecord: false });
      }
    });

    it('keeps waiting, with no code to show, when the server is silent after 4 s', () => {
      const result = resolveColdStart(
        input({ server: { kind: 'pending' }, record: { kind: 'absent' }, slowSignal: true }),
      );
      assert.deepEqual(result, { decision: { kind: 'wait' }, discardRecord: false });
    });
  });

  it('treats a record as foreign when the session has no user, never as valid', () => {
    const result = resolveColdStart(input({ userId: null, server: offline }));
    assert.deepEqual(result, {
      decision: { kind: 'failed', reason: 'offline' },
      discardRecord: true,
    });
  });
});

describe('startupPhaseOf', () => {
  const open = { skipped: false, routed: false };

  it('is idle without a session, whatever else was decided before', () => {
    assert.equal(startupPhaseOf({ kind: 'idle' }, open), 'idle');
    assert.equal(startupPhaseOf({ kind: 'idle' }, { skipped: true, routed: true }), 'idle');
  });

  it('is checking while it waits, so the usual veil and loader are shown', () => {
    assert.equal(startupPhaseOf({ kind: 'wait' }, open), 'checking');
  });

  it('is the failure of the server when there is nothing to restore, so the usual gate is shown', () => {
    assert.equal(startupPhaseOf({ kind: 'failed', reason: 'offline' }, open), 'offline');
    assert.equal(startupPhaseOf({ kind: 'failed', reason: 'error' }, open), 'error');
  });

  it('is done as soon as the server answered or the saved trip is restored, with no gate in between', () => {
    assert.equal(startupPhaseOf({ kind: 'server', trip: null }, open), 'done');
    assert.equal(
      startupPhaseOf({ kind: 'restore', record: record(), mode: 'offline' }, open),
      'done',
    );
  });

  it('is done after the passenger chose to continue home, or after it already routed', () => {
    assert.equal(
      startupPhaseOf({ kind: 'failed', reason: 'offline' }, { skipped: true, routed: false }),
      'done',
    );
    assert.equal(startupPhaseOf({ kind: 'wait' }, { skipped: false, routed: true }), 'done');
  });
});

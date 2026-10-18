import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { canRestorePickup, tripScreenMode, type TripScreenModeInput } from './trip-screen-mode.ts';
import { START_CODE_RECORD_VERSION, type StartCodeRecord } from './start-code-record.ts';

const NOW = 1_800_000_000_000;

function record(overrides: Partial<StartCodeRecord> = {}): StartCodeRecord {
  return {
    version: START_CODE_RECORD_VERSION,
    trip_request_id: 41,
    user_id: 7,
    start_code: '4821',
    saved_at: NOW - 1000,
    ...overrides,
  };
}

function input(overrides: Partial<TripScreenModeInput> = {}): TripScreenModeInput {
  return {
    hasFreshData: false,
    isError: false,
    notOwnedOrMissing: false,
    offline: false,
    retrying: false,
    lastAttemptFailed: false,
    restoredRecord: null,
    enteredFromSaved: false,
    ...overrides,
  };
}

describe('tripScreenMode', () => {
  describe('with fresh data from the server', () => {
    it('goes with the server, even when a record exists (RN-CS-05)', () => {
      const mode = tripScreenMode(input({ hasFreshData: true, restoredRecord: record() }));
      assert.deepEqual(mode, { kind: 'server' });
    });

    it('goes with the server when the phone is offline, which keeps the open screen working', () => {
      assert.deepEqual(tripScreenMode(input({ hasFreshData: true, offline: true })), {
        kind: 'server',
      });
    });

    it('goes with the server on a 500 that follows fresh data (U-15)', () => {
      const mode = tripScreenMode(
        input({ hasFreshData: true, isError: true, notOwnedOrMissing: false }),
      );
      assert.deepEqual(mode, { kind: 'server' });
    });
  });

  describe('R-1: a 403 or a 404 wins over whatever is in the cache (U-07, U-15)', () => {
    it('is not found with cached data and a 403 or 404 on the last request', () => {
      const mode = tripScreenMode(
        input({ hasFreshData: true, isError: true, notOwnedOrMissing: true }),
      );
      assert.deepEqual(mode, { kind: 'not_found' });
    });

    it('is not found when the cached data is not fresh either', () => {
      const mode = tripScreenMode(
        input({ hasFreshData: false, isError: true, notOwnedOrMissing: true }),
      );
      assert.deepEqual(mode, { kind: 'not_found' });
    });

    it('is not found even with a valid record for the same trip', () => {
      const mode = tripScreenMode(
        input({
          isError: true,
          notOwnedOrMissing: true,
          restoredRecord: record(),
          enteredFromSaved: true,
          offline: true,
        }),
      );
      assert.deepEqual(mode, { kind: 'not_found' });
    });

    it('needs the last request to have failed: a stale flag alone does nothing', () => {
      const mode = tripScreenMode(input({ hasFreshData: true, notOwnedOrMissing: true }));
      assert.deepEqual(mode, { kind: 'server' });
    });
  });

  describe('R-3: data from before the session is never painted', () => {
    it('does not go with the server when the data is not fresh', () => {
      const mode = tripScreenMode(input({ hasFreshData: false }));
      assert.notEqual(mode.kind, 'server');
      assert.deepEqual(mode, { kind: 'loading' });
    });

    it('stays loading, never server, for a deep link without a record', () => {
      const mode = tripScreenMode(input({ hasFreshData: false, enteredFromSaved: true }));
      assert.deepEqual(mode, { kind: 'loading' });
    });
  });

  describe('restored from the saved record', () => {
    it('is offline when there is no network', () => {
      const mode = tripScreenMode(input({ offline: true, restoredRecord: record() }));
      assert.deepEqual(mode, { kind: 'restored', record: record(), note: 'offline' });
    });

    it('is an error when the request failed without a 403 or a 404', () => {
      const mode = tripScreenMode(input({ isError: true, restoredRecord: record() }));
      assert.deepEqual(mode, { kind: 'restored', record: record(), note: 'error' });
    });

    it('stays an error between two polls, when the request in flight makes isError flicker', () => {
      const mode = tripScreenMode(
        input({ isError: false, lastAttemptFailed: true, restoredRecord: record() }),
      );
      assert.deepEqual(mode, { kind: 'restored', record: record(), note: 'error' });
    });

    it('is checking when it was entered from the saved route and nothing has answered', () => {
      const mode = tripScreenMode(input({ enteredFromSaved: true, restoredRecord: record() }));
      assert.deepEqual(mode, { kind: 'restored', record: record(), note: 'checking' });
    });

    it('is checking, not an error, while the passenger retries', () => {
      const mode = tripScreenMode(
        input({ isError: true, retrying: true, restoredRecord: record() }),
      );
      assert.deepEqual(mode, { kind: 'restored', record: record(), note: 'checking' });
    });

    it('stays offline while the passenger retries without a network', () => {
      const mode = tripScreenMode(
        input({ offline: true, isError: true, retrying: true, restoredRecord: record() }),
      );
      assert.deepEqual(mode, { kind: 'restored', record: record(), note: 'offline' });
    });

    it('shows the loader, not the code, when there is a record but the screen was not entered from it', () => {
      const mode = tripScreenMode(input({ restoredRecord: record() }));
      assert.deepEqual(mode, { kind: 'loading' });
    });
  });

  describe('without a record', () => {
    it('is empty and offline when there is no network', () => {
      assert.deepEqual(tripScreenMode(input({ offline: true })), {
        kind: 'empty',
        reason: 'offline',
      });
    });

    it('is empty with an error when the request failed', () => {
      assert.deepEqual(tripScreenMode(input({ isError: true })), {
        kind: 'empty',
        reason: 'error',
      });
    });

    it('stays empty with an error between two polls, instead of going back to the loader', () => {
      assert.deepEqual(tripScreenMode(input({ lastAttemptFailed: true })), {
        kind: 'empty',
        reason: 'error',
      });
    });

    it('prefers offline to error when both are true', () => {
      assert.deepEqual(tripScreenMode(input({ offline: true, isError: true })), {
        kind: 'empty',
        reason: 'offline',
      });
    });

    it('is loading otherwise', () => {
      assert.deepEqual(tripScreenMode(input()), { kind: 'loading' });
    });

    it('ignores the saved route flag, because there is nothing saved to show', () => {
      assert.deepEqual(tripScreenMode(input({ enteredFromSaved: true })), { kind: 'loading' });
    });
  });
});

describe('canRestorePickup (R-4, U-16)', () => {
  it('does not read the disk without a valid record and without data the server confirmed', () => {
    assert.equal(
      canRestorePickup({ restoredRecord: null, tripRequestId: 41, hasFreshData: false }),
      false,
    );
  });

  it('does not read it for a valid record of another trip', () => {
    assert.equal(
      canRestorePickup({
        restoredRecord: record({ trip_request_id: 40 }),
        tripRequestId: 41,
        hasFreshData: false,
      }),
      false,
    );
  });

  it('reads it with a valid record of the same trip', () => {
    assert.equal(
      canRestorePickup({ restoredRecord: record(), tripRequestId: 41, hasFreshData: false }),
      true,
    );
  });

  it('reads it when the server confirmed the trip in this session', () => {
    assert.equal(
      canRestorePickup({ restoredRecord: null, tripRequestId: 41, hasFreshData: true }),
      true,
    );
  });

  it('never reads it when the screen has no trip id', () => {
    assert.equal(
      canRestorePickup({ restoredRecord: null, tripRequestId: null, hasFreshData: true }),
      false,
    );
    assert.equal(
      canRestorePickup({ restoredRecord: record(), tripRequestId: null, hasFreshData: false }),
      false,
    );
  });
});

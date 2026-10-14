import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  modeEntryAnnouncement,
  nextLastAttemptFailed,
  retryFeedbackRemainingMs,
  savedTripMode,
} from './saved-trip-mode.ts';

describe('savedTripMode', () => {
  it('is offline whenever the phone says there is no network, whatever else happens', () => {
    for (const lastAttemptFailed of [true, false]) {
      for (const retrying of [true, false]) {
        const mode = savedTripMode({ networkStatus: 'offline', lastAttemptFailed, retrying });
        assert.equal(mode, 'offline');
      }
    }
  });

  it('is checking when there is a network and no result yet', () => {
    const mode = savedTripMode({
      networkStatus: 'online',
      lastAttemptFailed: false,
      retrying: false,
    });
    assert.equal(mode, 'checking');
  });

  it('is an error when there is a network and the last attempt failed', () => {
    const mode = savedTripMode({
      networkStatus: 'online',
      lastAttemptFailed: true,
      retrying: false,
    });
    assert.equal(mode, 'error');
  });

  it('goes back to checking while the passenger retries after an error', () => {
    const mode = savedTripMode({
      networkStatus: 'online',
      lastAttemptFailed: true,
      retrying: true,
    });
    assert.equal(mode, 'checking');
  });

  it('stays offline while the passenger retries without a network', () => {
    const mode = savedTripMode({
      networkStatus: 'offline',
      lastAttemptFailed: true,
      retrying: true,
    });
    assert.equal(mode, 'offline');
  });

  it('does not oscillate on its own: the same facts always give the same mode', () => {
    const facts = { networkStatus: 'online', lastAttemptFailed: true, retrying: false } as const;
    const modes = Array.from({ length: 5 }, () => savedTripMode(facts));
    assert.deepEqual(new Set(modes), new Set(['error']));
  });

  it('moves from offline to checking when the network returns', () => {
    const before = savedTripMode({
      networkStatus: 'offline',
      lastAttemptFailed: false,
      retrying: false,
    });
    const after = savedTripMode({
      networkStatus: 'online',
      lastAttemptFailed: false,
      retrying: false,
    });
    assert.deepEqual([before, after], ['offline', 'checking']);
  });
});

describe('modeEntryAnnouncement', () => {
  it('never announces on mount, because the alert notice already says it', () => {
    for (const next of ['offline', 'checking', 'error'] as const) {
      assert.equal(modeEntryAnnouncement(null, next), null);
    }
  });

  it('announces when it enters offline or error from another mode', () => {
    assert.equal(modeEntryAnnouncement('checking', 'offline'), 'offline');
    assert.equal(modeEntryAnnouncement('error', 'offline'), 'offline');
    assert.equal(modeEntryAnnouncement('checking', 'error'), 'error');
    assert.equal(modeEntryAnnouncement('offline', 'error'), 'error');
  });

  it('never announces checking, because it is transitory', () => {
    assert.equal(modeEntryAnnouncement('offline', 'checking'), null);
    assert.equal(modeEntryAnnouncement('error', 'checking'), null);
  });

  it('stays quiet when the mode does not change', () => {
    for (const mode of ['offline', 'checking', 'error'] as const) {
      assert.equal(modeEntryAnnouncement(mode, mode), null);
    }
  });
});

describe('retryFeedbackRemainingMs', () => {
  it('keeps the loading state until the minimum has passed, so an instant failure does not look broken', () => {
    assert.equal(retryFeedbackRemainingMs(0, 600), 600);
    assert.equal(retryFeedbackRemainingMs(250, 600), 350);
  });

  it('adds nothing once the request itself took longer than the minimum', () => {
    assert.equal(retryFeedbackRemainingMs(600, 600), 0);
    assert.equal(retryFeedbackRemainingMs(4000, 600), 0);
  });

  it('is never negative, even with a clock that went backwards', () => {
    assert.equal(retryFeedbackRemainingMs(-50, 600), 600);
  });
});

describe('nextLastAttemptFailed', () => {
  it('turns on when a request fails', () => {
    assert.equal(nextLastAttemptFailed(false, { isError: true, cameBackOnline: false }), true);
  });

  it('stays on while the request in flight makes isError flicker, so the mode does not oscillate', () => {
    assert.equal(nextLastAttemptFailed(true, { isError: false, cameBackOnline: false }), true);
  });

  it('stays off while nothing has failed', () => {
    assert.equal(nextLastAttemptFailed(false, { isError: false, cameBackOnline: false }), false);
  });

  it('turns off when the network returns, because the old failure belonged to the offline period', () => {
    assert.equal(nextLastAttemptFailed(true, { isError: false, cameBackOnline: true }), false);
    assert.equal(nextLastAttemptFailed(true, { isError: true, cameBackOnline: true }), false);
  });
});

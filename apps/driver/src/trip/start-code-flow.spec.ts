import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  classifyStartFailure,
  isStartCodeRequiredError,
  resolveUncertainStart,
  startSheetView,
  type StartSheetInput,
} from './start-code-flow.ts';

function http(status: number, code?: string, body?: unknown, retryAfterSec?: number) {
  return { kind: 'http', status, code, body, retryAfterSec };
}

describe('classifyStartFailure', () => {
  it('reads the remaining attempts from a 422 START_CODE_INVALID', () => {
    const error = http(422, 'START_CODE_INVALID', {
      code: 'START_CODE_INVALID',
      attempts_remaining: 3,
    });
    assert.deepEqual(classifyStartFailure(error), { kind: 'invalid', attemptsRemaining: 3 });
  });

  it('keeps an invalid code without a count when the server omits it', () => {
    assert.deepEqual(classifyStartFailure(http(422, 'START_CODE_INVALID', {})), {
      kind: 'invalid',
      attemptsRemaining: null,
    });
  });

  it('recognises the block, with or without the right code', () => {
    assert.deepEqual(classifyStartFailure(http(409, 'START_CODE_BLOCKED')), { kind: 'blocked' });
  });

  it('treats any other 409 and the trip lookup failures as the trip having changed', () => {
    assert.deepEqual(classifyStartFailure(http(409, 'INVALID_TRIP_TRANSITION')), {
      kind: 'changed',
    });
    assert.deepEqual(classifyStartFailure(http(403, 'NOT_THE_DRIVER')), { kind: 'changed' });
    assert.deepEqual(classifyStartFailure(http(404, 'TRIP_REQUEST_NOT_FOUND')), {
      kind: 'changed',
    });
  });

  it('reads Retry-After from a 429 and falls back to 10 seconds', () => {
    assert.deepEqual(classifyStartFailure(http(429, undefined, undefined, 25)), {
      kind: 'rate_limited',
      waitSec: 25,
    });
    assert.deepEqual(classifyStartFailure(http(429)), { kind: 'rate_limited', waitSec: 10 });
  });

  it('treats a lost connection or an unreadable answer as uncertain, never as a failed attempt', () => {
    assert.deepEqual(classifyStartFailure({ kind: 'network' }), { kind: 'uncertain' });
    assert.deepEqual(classifyStartFailure({ kind: 'validation' }), { kind: 'uncertain' });
  });

  it('maps everything else to a server error', () => {
    assert.deepEqual(classifyStartFailure(http(500)), { kind: 'server' });
    assert.deepEqual(classifyStartFailure(http(400, 'VALIDATION')), { kind: 'server' });
    assert.deepEqual(classifyStartFailure(new Error('boom')), { kind: 'server' });
    assert.deepEqual(classifyStartFailure(null), { kind: 'server' });
  });
});

describe('isStartCodeRequiredError', () => {
  it('matches only the 422 START_CODE_REQUIRED', () => {
    assert.equal(isStartCodeRequiredError(http(422, 'START_CODE_REQUIRED')), true);
    assert.equal(isStartCodeRequiredError(http(422, 'START_CODE_INVALID')), false);
    assert.equal(isStartCodeRequiredError(http(409, 'START_CODE_REQUIRED')), false);
  });
});

describe('resolveUncertainStart', () => {
  const before = { attemptsRemaining: 4 };
  const open = { status: 'driver_en_route', start_blocked: false, start_attempts_remaining: 4 };

  it('reports the trip as started when the server moved it forward', () => {
    assert.deepEqual(resolveUncertainStart(before, { ...open, status: 'in_progress' }), {
      kind: 'started',
    });
  });

  it('reports the block', () => {
    assert.deepEqual(resolveUncertainStart(before, { ...open, start_blocked: true }), {
      kind: 'blocked',
    });
  });

  it('shows the new count when an attempt was spent', () => {
    assert.deepEqual(resolveUncertainStart(before, { ...open, start_attempts_remaining: 3 }), {
      kind: 'invalid',
      attemptsRemaining: 3,
    });
  });

  it('says the code was not sent when nothing changed', () => {
    assert.deepEqual(resolveUncertainStart(before, open), { kind: 'not_sent' });
    assert.deepEqual(resolveUncertainStart({ attemptsRemaining: null }, open), {
      kind: 'not_sent',
    });
  });

  it('stays unknown when the trip could not be read again', () => {
    assert.deepEqual(resolveUncertainStart(before, null), { kind: 'unknown' });
  });
});

describe('startSheetView', () => {
  const base: StartSheetInput = {
    digits: '',
    length: 4,
    maxAttempts: 5,
    phase: 'editing',
    failure: null,
    errorShake: false,
    attemptsRemaining: 5,
    online: true,
    rateLimitedForSec: 0,
  };

  it('H1: starts empty with the confirm button disabled and no message', () => {
    const view = startSheetView(base);
    assert.equal(view.confirmEnabled, false);
    assert.equal(view.message, null);
    assert.equal(view.otpStatus, 'editing');
  });

  it('enables the button only with the four digits, never sending by itself', () => {
    assert.equal(startSheetView({ ...base, digits: '123' }).confirmEnabled, false);
    assert.equal(startSheetView({ ...base, digits: '1234' }).confirmEnabled, true);
  });

  it('H2: locks the field, the button and the way out while verifying', () => {
    const view = startSheetView({ ...base, digits: '1234', phase: 'verifying' });
    assert.equal(view.otpStatus, 'verifying');
    assert.equal(view.confirmEnabled, false);
    assert.equal(view.fieldDisabled, true);
    assert.equal(view.dismissible, false);
    assert.equal(view.busy, true);
  });

  it('H3: shows the remaining attempts and shakes once', () => {
    const view = startSheetView({
      ...base,
      failure: { kind: 'invalid', attemptsRemaining: 3 },
      errorShake: true,
      attemptsRemaining: 3,
    });
    assert.deepEqual(view.message, { kind: 'invalid', attemptsRemaining: 3 });
    assert.equal(view.otpStatus, 'error');
    const settled = startSheetView({
      ...base,
      failure: { kind: 'invalid', attemptsRemaining: 3 },
      attemptsRemaining: 3,
    });
    assert.equal(settled.otpStatus, 'editing');
    assert.deepEqual(settled.message, { kind: 'invalid', attemptsRemaining: 3 });
  });

  it('H4: warns about the last attempt before sending', () => {
    const view = startSheetView({ ...base, digits: '1234', attemptsRemaining: 1 });
    assert.equal(view.lastAttemptWarning, true);
    assert.equal(view.confirmEnabled, true);
    assert.equal(startSheetView({ ...base, attemptsRemaining: 2 }).lastAttemptWarning, false);
  });

  it('shows the prior failures when the sheet reopens after earlier attempts', () => {
    assert.deepEqual(startSheetView({ ...base, attemptsRemaining: 3 }).message, {
      kind: 'prior_attempts',
      attemptsRemaining: 3,
    });
    assert.equal(startSheetView({ ...base, attemptsRemaining: 5 }).message, null);
    assert.equal(startSheetView({ ...base, attemptsRemaining: null }).message, null);
  });

  it('H6: offline blocks the send, keeps the digits and spends nothing', () => {
    const view = startSheetView({ ...base, digits: '1234', online: false });
    assert.deepEqual(view.message, { kind: 'offline' });
    assert.equal(view.confirmEnabled, false);
  });

  it('H7: while rechecking after a lost response it says so and stays locked', () => {
    const view = startSheetView({ ...base, digits: '1234', phase: 'checking' });
    assert.deepEqual(view.message, { kind: 'checking' });
    assert.equal(view.confirmEnabled, false);
    assert.equal(view.dismissible, false);
  });

  it('H7: when nothing changed it says the code was not sent', () => {
    const view = startSheetView({ ...base, digits: '1234', failure: { kind: 'not_sent' } });
    assert.deepEqual(view.message, { kind: 'not_sent' });
    assert.equal(view.confirmEnabled, true);
  });

  it('H8: a 429 disables the button until the wait is over and spends no attempt', () => {
    const view = startSheetView({
      ...base,
      digits: '1234',
      failure: { kind: 'rate_limited', waitSec: 10 },
      rateLimitedForSec: 7,
      attemptsRemaining: 4,
    });
    assert.deepEqual(view.message, { kind: 'rate_limited' });
    assert.equal(view.confirmEnabled, false);
    const afterWait = startSheetView({ ...base, digits: '1234', attemptsRemaining: 4 });
    assert.equal(afterWait.confirmEnabled, true);
  });

  it('H10: a server error offers a retry without disabling the button', () => {
    const view = startSheetView({ ...base, digits: '1234', failure: { kind: 'server' } });
    assert.deepEqual(view.message, { kind: 'server' });
    assert.equal(view.confirmEnabled, true);
  });

  it('never enables sending with no attempts left', () => {
    const view = startSheetView({ ...base, digits: '1234', attemptsRemaining: 0 });
    assert.equal(view.confirmEnabled, false);
  });

  it('H9: success shows the green state without a message', () => {
    const view = startSheetView({ ...base, digits: '1234', phase: 'success' });
    assert.equal(view.otpStatus, 'success');
    assert.equal(view.message, null);
  });
});

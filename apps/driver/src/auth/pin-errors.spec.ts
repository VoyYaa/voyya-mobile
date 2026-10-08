import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { classifyChangePinError, isPinChangeRequiredError } from './pin-errors.ts';

describe('classifyChangePinError', () => {
  it('maps the codes of POST /auth/driver/pin', () => {
    assert.deepEqual(classifyChangePinError({ kind: 'network' }), { kind: 'offline' });
    assert.deepEqual(
      classifyChangePinError({ kind: 'http', status: 401, code: 'TEMPORARY_PIN_EXPIRED' }),
      { kind: 'expired' },
    );
    assert.deepEqual(
      classifyChangePinError({ kind: 'http', status: 401, code: 'INVALID_CREDENTIALS' }),
      { kind: 'wrong_current' },
    );
    assert.deepEqual(classifyChangePinError({ kind: 'http', status: 422, code: 'PIN_TOO_WEAK' }), {
      kind: 'too_weak',
    });
    assert.deepEqual(
      classifyChangePinError({
        kind: 'http',
        status: 429,
        code: 'ACCOUNT_TEMPORARILY_BLOCKED',
        retryInSec: 840,
      }),
      { kind: 'blocked', retryInSec: 840 },
    );
  });

  it('keeps a blocked error without a wait time', () => {
    assert.deepEqual(
      classifyChangePinError({ kind: 'http', status: 429, code: 'ACCOUNT_TEMPORARILY_BLOCKED' }),
      { kind: 'blocked', retryInSec: undefined },
    );
  });

  it('treats anything else as a server failure', () => {
    assert.deepEqual(classifyChangePinError({ kind: 'http', status: 500 }), { kind: 'server' });
    assert.deepEqual(classifyChangePinError({ kind: 'validation' }), { kind: 'server' });
    assert.deepEqual(classifyChangePinError(null), { kind: 'server' });
  });
});

describe('isPinChangeRequiredError', () => {
  it('recognizes only 403 PIN_CHANGE_REQUIRED', () => {
    assert.equal(isPinChangeRequiredError({ status: 403, code: 'PIN_CHANGE_REQUIRED' }), true);
    assert.equal(isPinChangeRequiredError({ status: 401, code: 'PIN_CHANGE_REQUIRED' }), false);
    assert.equal(isPinChangeRequiredError({ status: 403, code: 'FORBIDDEN' }), false);
    assert.equal(isPinChangeRequiredError(undefined), false);
  });
});

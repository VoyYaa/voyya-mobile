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

describe('classifyChangePinError with INVALID_DATA', () => {
  const invalid = (details: unknown) => ({
    kind: 'http',
    status: 400,
    code: 'INVALID_DATA',
    body: { code: 'INVALID_DATA', message: 'Solicitud inválida', details },
  });

  it('maps new_pin and current_pin details to field messages', () => {
    assert.deepEqual(
      classifyChangePinError(
        invalid([{ field: 'new_pin', error: 'Elige un PIN menos fácil de adivinar' }]),
      ),
      { kind: 'invalid_data', next: 'Elige un PIN menos fácil de adivinar', current: undefined },
    );
    assert.deepEqual(
      classifyChangePinError(
        invalid([
          { field: 'current_pin', error: 'PIN inválido (4 a 6 dígitos)' },
          { field: 'new_pin', error: 'El PIN debe tener 6 dígitos' },
        ]),
      ),
      {
        kind: 'invalid_data',
        next: 'El PIN debe tener 6 dígitos',
        current: 'PIN inválido (4 a 6 dígitos)',
      },
    );
  });

  it('ignores root-level issues with an empty field and keeps the field ones', () => {
    assert.deepEqual(
      classifyChangePinError(
        invalid([
          { field: '', error: 'Revisa los datos' },
          { field: 'new_pin', error: 'El PIN debe tener 6 dígitos' },
        ]),
      ),
      { kind: 'invalid_data', next: 'El PIN debe tener 6 dígitos', current: undefined },
    );
  });

  it('rejects a body that is not an AuthError of the contract', () => {
    const body = { code: 'NOT_A_CODE', message: 'x', details: [{ field: 'new_pin', error: 'x' }] };
    assert.deepEqual(
      classifyChangePinError({ kind: 'http', status: 400, code: 'INVALID_DATA', body }),
      { kind: 'server' },
    );
    const missingMessage = { code: 'INVALID_DATA', details: [{ field: 'new_pin', error: 'x' }] };
    assert.deepEqual(
      classifyChangePinError({
        kind: 'http',
        status: 400,
        code: 'INVALID_DATA',
        body: missingMessage,
      }),
      { kind: 'server' },
    );
  });

  it('falls back to a server failure for unknown fields or malformed bodies', () => {
    assert.deepEqual(classifyChangePinError(invalid([{ field: 'other', error: 'x' }])), {
      kind: 'server',
    });
    assert.deepEqual(classifyChangePinError(invalid('nope')), { kind: 'server' });
    assert.deepEqual(classifyChangePinError({ kind: 'http', status: 400, code: 'INVALID_DATA' }), {
      kind: 'server',
    });
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

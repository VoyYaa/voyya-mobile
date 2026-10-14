import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ZodError } from 'zod';

import { classifyOtpFailure } from './otp-errors.ts';

interface Shape {
  kind: string;
  status?: number;
  code?: string;
  retryInSec?: number;
  retryAfterSec?: number;
  message?: string;
}

function failure(shape: Shape): Error & Shape {
  return Object.assign(new Error(shape.message ?? 'message'), shape);
}

const http = (status: number, code?: string, extra: Partial<Shape> = {}): Error & Shape =>
  failure({ kind: 'http', status, code, ...extra });

interface Row {
  row: number;
  name: string;
  error: unknown;
  verify: unknown;
  request: unknown;
}

const rows: Row[] = [
  {
    row: 1,
    name: 'no network, or no answer in time',
    error: failure({ kind: 'network' }),
    verify: { kind: 'offline' },
    request: { kind: 'offline' },
  },
  {
    row: 2,
    name: '401 OTP_INVALID',
    error: http(401, 'OTP_INVALID'),
    verify: { kind: 'incorrect' },
    request: { kind: 'server' },
  },
  {
    row: 3,
    name: '410 OTP_EXPIRED',
    error: http(410, 'OTP_EXPIRED'),
    verify: { kind: 'expired' },
    request: { kind: 'server' },
  },
  {
    row: 4,
    name: '429 OTP_MAX_ATTEMPTS',
    error: http(429, 'OTP_MAX_ATTEMPTS'),
    verify: { kind: 'max_attempts' },
    request: { kind: 'server' },
  },
  {
    row: 5,
    name: '429 OTP_RATE_LIMIT with retry_in_sec',
    error: http(429, 'OTP_RATE_LIMIT', { retryInSec: 30 }),
    verify: { kind: 'server' },
    request: { kind: 'rate_limited', retryInSec: 30 },
  },
  {
    row: 5,
    name: '429 OTP_RATE_LIMIT with a day of wait',
    error: http(429, 'OTP_RATE_LIMIT', { retryInSec: 86400 }),
    verify: { kind: 'server' },
    request: { kind: 'rate_limited', retryInSec: 86400 },
  },
  {
    row: 5,
    name: '429 OTP_RATE_LIMIT without retry_in_sec',
    error: http(429, 'OTP_RATE_LIMIT'),
    verify: { kind: 'server' },
    request: { kind: 'rate_limited', retryInSec: null },
  },
  {
    row: 6,
    name: '429 without code and with Retry-After (the limiter by IP)',
    error: http(429, undefined, { retryAfterSec: 12 }),
    verify: { kind: 'throttled' },
    request: { kind: 'throttled' },
  },
  {
    row: 6,
    name: '429 without code and without Retry-After',
    error: http(429),
    verify: { kind: 'throttled' },
    request: { kind: 'throttled' },
  },
  {
    row: 7,
    name: '400 INVALID_DATA',
    error: http(400, 'INVALID_DATA'),
    verify: { kind: 'server' },
    request: { kind: 'invalid_phone' },
  },
  {
    row: 8,
    name: '500 without code',
    error: http(500),
    verify: { kind: 'server' },
    request: { kind: 'server' },
  },
  {
    row: 8,
    name: '503 without code (SMS_SEND_FAILED is outside AuthErrorCode, so it arrives without one)',
    error: http(503),
    verify: { kind: 'server' },
    request: { kind: 'server' },
  },
  {
    row: 8,
    name: '503 with the code SMS_SEND_FAILED, in case the contract learns it',
    error: http(503, 'SMS_SEND_FAILED'),
    verify: { kind: 'server' },
    request: { kind: 'server' },
  },
  {
    row: 8,
    name: '403 without code',
    error: http(403),
    verify: { kind: 'server' },
    request: { kind: 'server' },
  },
  {
    row: 8,
    name: '403 FORBIDDEN, which is not a suspension',
    error: http(403, 'FORBIDDEN'),
    verify: { kind: 'server' },
    request: { kind: 'server' },
  },
  {
    row: 8,
    name: '401 with ACCOUNT_SUSPENDED, a status that does not belong to that code',
    error: http(401, 'ACCOUNT_SUSPENDED'),
    verify: { kind: 'server' },
    request: { kind: 'server' },
  },
  {
    row: 8,
    name: '409 with ACCOUNT_SUSPENDED, a status that does not belong to that code',
    error: http(409, 'ACCOUNT_SUSPENDED'),
    verify: { kind: 'server' },
    request: { kind: 'server' },
  },
  {
    row: 8,
    name: 'a response that does not have the expected shape',
    error: failure({ kind: 'validation' }),
    verify: { kind: 'server' },
    request: { kind: 'server' },
  },
  {
    row: 8,
    name: 'a ZodError thrown by the client before sending',
    error: new ZodError([]),
    verify: { kind: 'server' },
    request: { kind: 'server' },
  },
  {
    row: 8,
    name: 'any other Error',
    error: new Error('boom'),
    verify: { kind: 'server' },
    request: { kind: 'server' },
  },
  {
    row: 8,
    name: 'something that is not an error',
    error: 'boom',
    verify: { kind: 'server' },
    request: { kind: 'server' },
  },
  {
    row: 8,
    name: 'nothing',
    error: undefined,
    verify: { kind: 'server' },
    request: { kind: 'server' },
  },
  {
    row: 8,
    name: 'a code that does not belong to its status',
    error: http(401, 'OTP_EXPIRED'),
    verify: { kind: 'server' },
    request: { kind: 'server' },
  },
  {
    row: 8,
    name: '410 without code',
    error: http(410),
    verify: { kind: 'server' },
    request: { kind: 'server' },
  },
  {
    row: 8,
    name: '400 with the code of another failure',
    error: http(400, 'OTP_INVALID'),
    verify: { kind: 'server' },
    request: { kind: 'server' },
  },
  {
    row: 9,
    name: '403 ACCOUNT_SUSPENDED (suspended when verifying, server when requesting)',
    error: http(403, 'ACCOUNT_SUSPENDED'),
    verify: { kind: 'suspended' },
    request: { kind: 'server' },
  },
];

describe('classifyOtpFailure', () => {
  for (const { row, name, error, verify, request } of rows) {
    it(`row ${row}, ${name}, when verifying`, () => {
      assert.deepEqual(classifyOtpFailure(error, 'verify'), verify);
    });
    it(`row ${row}, ${name}, when requesting`, () => {
      assert.deepEqual(classifyOtpFailure(error, 'request'), request);
    });
  }

  it('treats a retry_in_sec that is not positive as an unknown time', () => {
    for (const retryInSec of [0, -5, Number.NaN]) {
      assert.deepEqual(classifyOtpFailure(http(429, 'OTP_RATE_LIMIT', { retryInSec }), 'request'), {
        kind: 'rate_limited',
        retryInSec: null,
      });
    }
  });

  it('never reads the message, so the text of the server cannot change what the person sees', () => {
    const messages = ['Código incorrecto', 'El conductor no está registrado', 'empresa', ''];
    for (const message of messages) {
      assert.deepEqual(classifyOtpFailure(http(401, 'OTP_INVALID', { message }), 'verify'), {
        kind: 'incorrect',
      });
      assert.deepEqual(
        classifyOtpFailure(http(429, 'OTP_RATE_LIMIT', { message, retryInSec: 5 }), 'request'),
        {
          kind: 'rate_limited',
          retryInSec: 5,
        },
      );
    }
  });

  it('decides a suspension only by status and code, whatever the message says', () => {
    for (const message of ['Cuenta suspendida', '', 'empresa']) {
      assert.deepEqual(classifyOtpFailure(http(403, 'ACCOUNT_SUSPENDED', { message }), 'verify'), {
        kind: 'suspended',
      });
      assert.deepEqual(classifyOtpFailure(http(403, 'ACCOUNT_SUSPENDED', { message }), 'request'), {
        kind: 'server',
      });
    }
  });

  it('does not take a network failure or a non-http failure for a suspension', () => {
    const lookalike = Object.assign(new Error('x'), {
      kind: 'validation',
      status: 403,
      code: 'ACCOUNT_SUSPENDED',
    });
    assert.deepEqual(classifyOtpFailure(lookalike, 'verify'), { kind: 'server' });
    const offline = Object.assign(new Error('x'), {
      kind: 'network',
      status: 403,
      code: 'ACCOUNT_SUSPENDED',
    });
    assert.deepEqual(classifyOtpFailure(offline, 'verify'), { kind: 'offline' });
  });
});

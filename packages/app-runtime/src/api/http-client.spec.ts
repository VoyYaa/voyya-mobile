import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { z } from 'zod';
import { configureApiClient, configureAuthHandlers, apiRequest } from './http-client.ts';
import { ApiError, isRateLimitedError, rateLimitWaitSec } from './errors.ts';

const ErrorBody = z.object({ code: z.string(), message: z.string() });
const OkBody = z.object({ ok: z.literal(true) });

const realFetch = globalThis.fetch;

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('apiRequest 401 handling', () => {
  let calls: number;
  let refreshCalls: number;
  let expiredCalls: number;
  let refreshedToken: string | null;

  beforeEach(() => {
    calls = 0;
    refreshCalls = 0;
    expiredCalls = 0;
    refreshedToken = null;
    configureApiClient({ baseUrl: 'http://api.test', defaultErrorSchema: ErrorBody });
    configureAuthHandlers({
      getAccessToken: () => 'access',
      refreshAndRetry: async () => {
        refreshCalls += 1;
        return refreshedToken;
      },
      onSessionExpired: () => {
        expiredCalls += 1;
      },
    });
    globalThis.fetch = async () => {
      calls += 1;
      return jsonResponse(401, { code: 'INVALID_CREDENTIALS', message: 'Credenciales inválidas' });
    };
  });

  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  it('refreshes and expires the session on 401 by default', async () => {
    await assert.rejects(
      apiRequest({ method: 'POST', path: '/x' }, OkBody),
      (error: unknown) => error instanceof ApiError && error.code === 'INVALID_CREDENTIALS',
    );
    assert.equal(refreshCalls, 1);
    assert.equal(expiredCalls, 1);
    assert.equal(calls, 1);
  });

  it('retries once when the refresh succeeds', async () => {
    refreshedToken = 'fresh';
    await assert.rejects(apiRequest({ method: 'POST', path: '/x' }, OkBody));
    assert.equal(refreshCalls, 1);
    assert.equal(calls, 2);
    assert.equal(expiredCalls, 0);
  });

  it('delivers the 401 untouched with skipRefreshOn401', async () => {
    await assert.rejects(
      apiRequest({ method: 'POST', path: '/x', skipRefreshOn401: true }, OkBody),
      (error: unknown) =>
        error instanceof ApiError &&
        error.status === 401 &&
        error.code === 'INVALID_CREDENTIALS' &&
        error.message === 'Credenciales inválidas',
    );
    assert.equal(refreshCalls, 0);
    assert.equal(expiredCalls, 0);
    assert.equal(calls, 1);
  });

  it('keeps the full error body on ApiError', async () => {
    globalThis.fetch = async () =>
      jsonResponse(409, { code: 'ACTIVE_TRIP', message: 'Ya tienes un viaje', active_trip: 7 });
    await assert.rejects(
      apiRequest({ method: 'GET', path: '/x' }, OkBody),
      (error: unknown) =>
        error instanceof ApiError &&
        JSON.stringify(error.body) ===
          JSON.stringify({ code: 'ACTIVE_TRIP', message: 'Ya tienes un viaje', active_trip: 7 }),
    );
  });
});

describe('apiRequest 429 handling', () => {
  beforeEach(() => {
    configureApiClient({ baseUrl: 'http://api.test', defaultErrorSchema: ErrorBody });
    configureAuthHandlers({
      getAccessToken: () => 'access',
      refreshAndRetry: async () => null,
      onSessionExpired: () => undefined,
    });
  });

  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  function throttled(retryAfter: string | null): () => Promise<Response> {
    return async () =>
      new Response(JSON.stringify({ statusCode: 429, message: 'ThrottlerException' }), {
        status: 429,
        headers: retryAfter === null ? {} : { 'Retry-After': retryAfter },
      });
  }

  it('recognises the framework 429 by status and keeps Retry-After', async () => {
    globalThis.fetch = throttled('17');
    await assert.rejects(apiRequest({ method: 'POST', path: '/x' }, OkBody), (error: unknown) => {
      assert.equal(isRateLimitedError(error), true);
      assert.equal(rateLimitWaitSec(error), 17);
      return true;
    });
  });

  it('waits 10 seconds when Retry-After is missing or malformed', async () => {
    for (const header of [null, 'soon', '0', '-3', '1.5']) {
      globalThis.fetch = throttled(header);
      await assert.rejects(apiRequest({ method: 'POST', path: '/x' }, OkBody), (error: unknown) => {
        assert.equal(isRateLimitedError(error), true);
        assert.equal(rateLimitWaitSec(error), 10);
        return true;
      });
    }
  });

  it('does not treat other statuses or network failures as rate limited', async () => {
    globalThis.fetch = async () => jsonResponse(422, { code: 'X', message: 'm' });
    await assert.rejects(apiRequest({ method: 'POST', path: '/x' }, OkBody), (error: unknown) => {
      assert.equal(isRateLimitedError(error), false);
      return true;
    });
    globalThis.fetch = async () => {
      throw new TypeError('network down');
    };
    await assert.rejects(apiRequest({ method: 'POST', path: '/x' }, OkBody), (error: unknown) => {
      assert.equal(isRateLimitedError(error), false);
      return true;
    });
  });
});

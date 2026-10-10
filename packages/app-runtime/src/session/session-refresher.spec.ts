import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { SessionTokens } from '@voyyaa/shared';
import { ZodError } from 'zod';
import { ApiError } from '../api/errors.ts';
import { createSessionRefresher, type SessionRefresher } from './session-refresher.ts';

function tokens(suffix: string): SessionTokens {
  return {
    access_token: `access-${suffix}`,
    refresh_token: `refresh-${suffix}`,
    expires_in: 900,
  } as SessionTokens;
}

describe('createSessionRefresher', () => {
  let current: { accessToken: string | null; refreshToken: string | null };
  let requests: string[];
  let clears: number;
  let saves: number;
  let epoch: number;
  let revoked: string[];
  let outcome: () => Promise<SessionTokens>;
  let refresh: SessionRefresher;

  beforeEach(() => {
    current = { accessToken: 'access-0', refreshToken: 'refresh-0' };
    requests = [];
    clears = 0;
    saves = 0;
    epoch = 0;
    revoked = [];
    outcome = () => Promise.resolve(tokens('1'));
    refresh = createSessionRefresher({
      getCurrent: () => current,
      requestRefresh: async (refreshToken) => {
        requests.push(refreshToken);
        await new Promise<void>((resolve) => setImmediate(resolve));
        return outcome();
      },
      saveTokens: async (next) => {
        saves += 1;
        current = { accessToken: next.access_token, refreshToken: next.refresh_token };
      },
      getEpoch: () => epoch,
      revoke: async (refreshToken) => {
        revoked.push(refreshToken);
      },
      clear: async () => {
        clears += 1;
        epoch += 1;
        current = { accessToken: null, refreshToken: null };
      },
    });
  });

  it('shares a single refresh among simultaneous callers', async () => {
    const results = await Promise.all(Array.from({ length: 8 }, () => refresh('access-0')));
    assert.equal(requests.length, 1);
    assert.deepEqual(new Set(results), new Set(['access-1']));
    assert.equal(clears, 0);
  });

  it('starts a new refresh after the previous one settles', async () => {
    await refresh('access-0');
    outcome = () => Promise.resolve(tokens('2'));
    await refresh('access-1');
    assert.deepEqual(requests, ['refresh-0', 'refresh-1']);
  });

  it('reuses the current token when the request failed with an older one', async () => {
    current = { accessToken: 'access-9', refreshToken: 'refresh-9' };
    const token = await refresh('access-0');
    assert.equal(token, 'access-9');
    assert.equal(requests.length, 0);
  });

  it('clears the session on a definitive rejection', async () => {
    outcome = () => Promise.reject(new ApiError('http', 'revoked', 401, 'REFRESH_REVOKED'));
    assert.equal(await refresh('access-0'), null);
    assert.equal(clears, 1);
  });

  it('keeps the session and rethrows on a network error', async () => {
    outcome = () => Promise.reject(new ApiError('network', 'offline'));
    await assert.rejects(refresh('access-0'), (e: unknown) => e instanceof ApiError);
    assert.equal(clears, 0);
    assert.equal(current.refreshToken, 'refresh-0');
  });

  it('keeps the session on a server error', async () => {
    outcome = () => Promise.reject(new ApiError('http', 'boom', 503));
    await assert.rejects(refresh('access-0'));
    assert.equal(clears, 0);
  });

  it('does not clear when another refresh already rotated the token', async () => {
    outcome = () => {
      current = { accessToken: 'access-7', refreshToken: 'refresh-7' };
      return Promise.reject(new ApiError('http', 'revoked', 401, 'REFRESH_REVOKED'));
    };
    assert.equal(await refresh('access-0'), 'access-7');
    assert.equal(clears, 0);
  });

  it('returns null without calling the server when there is no refresh token', async () => {
    current = { accessToken: null, refreshToken: null };
    assert.equal(await refresh(null), null);
    assert.equal(requests.length, 0);
  });

  it('clears the session on a 400 from the refresh endpoint', async () => {
    outcome = () => Promise.reject(new ApiError('http', 'invalid', 400, 'INVALID_DATA'));
    assert.equal(await refresh('access-0'), null);
    assert.equal(clears, 1);
  });

  it('clears the session when the stored refresh token fails local validation', async () => {
    outcome = () => Promise.reject(new ZodError([]));
    assert.equal(await refresh('access-0'), null);
    assert.equal(clears, 1);
  });

  it('does not save the tokens and revokes the new refresh when the session was cleared in flight', async () => {
    const pending = refresh('access-0');
    epoch += 1;
    current = { accessToken: null, refreshToken: null };
    assert.equal(await pending, null);
    assert.equal(saves, 0);
    assert.deepEqual(revoked, ['refresh-1']);
    assert.equal(current.refreshToken, null);
  });

  it('does not overwrite the tokens of a user who signed in during the refresh', async () => {
    const pending = refresh('access-0');
    epoch += 1;
    current = { accessToken: 'access-B', refreshToken: 'refresh-B' };
    assert.equal(await pending, null);
    assert.equal(saves, 0);
    assert.deepEqual(revoked, ['refresh-1']);
    assert.equal(current.refreshToken, 'refresh-B');
  });

  it('does not clear a new session when the old refresh is rejected after sign-in', async () => {
    outcome = () => Promise.reject(new ApiError('http', 'revoked', 401, 'REFRESH_REVOKED'));
    const pending = refresh('access-0');
    epoch += 1;
    current = { accessToken: 'access-B', refreshToken: 'refresh-B' };
    assert.equal(await pending, null);
    assert.equal(clears, 0);
    assert.equal(current.refreshToken, 'refresh-B');
  });

  it('ignores a failing revoke of the discarded refresh', async () => {
    const failing = createSessionRefresher({
      getCurrent: () => current,
      requestRefresh: async () => tokens('1'),
      saveTokens: async () => undefined,
      clear: async () => undefined,
      getEpoch: () => epoch,
      revoke: async () => {
        throw new Error('offline');
      },
    });
    const pending = failing('access-0');
    epoch += 1;
    assert.equal(await pending, null);
  });

  it('lets a caller wait for the refresh in flight', async () => {
    const pending = refresh('access-0');
    await refresh.whenIdle();
    assert.equal(current.refreshToken, 'refresh-1');
    assert.equal(await pending, 'access-1');
  });

  it('is idle when nothing is in flight', async () => {
    await refresh.whenIdle();
    assert.equal(requests.length, 0);
  });
});

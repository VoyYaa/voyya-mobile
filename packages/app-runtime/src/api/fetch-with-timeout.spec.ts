import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { fetchWithTimeout } from './fetch-with-timeout.ts';

const realFetch = globalThis.fetch;

function hangingFetch(): typeof fetch {
  return (_url, init) =>
    new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => {
        const error = new Error('aborted');
        error.name = 'AbortError';
        reject(error);
      });
    });
}

describe('fetchWithTimeout', () => {
  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  it('aborts a request that never answers', async () => {
    globalThis.fetch = hangingFetch();
    await assert.rejects(
      fetchWithTimeout('http://api.test/x', {}, 20),
      (error: unknown) => error instanceof Error && error.name === 'AbortError',
    );
  });

  it('returns the response when the server answers in time', async () => {
    globalThis.fetch = async () => new Response('{}', { status: 200 });
    const response = await fetchWithTimeout('http://api.test/x', {}, 50);
    assert.equal(response.status, 200);
  });

  it('still honours the caller signal', async () => {
    globalThis.fetch = hangingFetch();
    const caller = new AbortController();
    const pending = fetchWithTimeout('http://api.test/x', { signal: caller.signal }, 5_000);
    caller.abort();
    await assert.rejects(
      pending,
      (error: unknown) => error instanceof Error && error.name === 'AbortError',
    );
  });
});

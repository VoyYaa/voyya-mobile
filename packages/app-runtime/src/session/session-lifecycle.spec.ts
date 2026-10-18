import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import {
  GUEST_IDENTITY,
  authenticatedIdentity,
  clearSessionIdentity,
  readSessionIdentity,
} from './session-lifecycle.ts';
import { onSessionCleared, runSessionClearedHandlers } from './session-cleanup.ts';

const user = {
  user_id: 7,
  first_name: 'Ana',
  last_name: 'Pérez',
  role: 'passenger',
} as never;

const persisted = {
  accessToken: 'access',
  refreshToken: 'refresh',
  user,
  accessTokenExpiresAt: 1_900_000_000_000,
};

describe('readSessionIdentity', () => {
  it('is authenticated, and stamps when the session started, when the storage has a session', async () => {
    const identity = await readSessionIdentity({
      readPersistedSession: async () => persisted,
      now: () => 1_800_000_000_000,
    });
    assert.deepEqual(identity, {
      status: 'authenticated',
      accessToken: 'access',
      refreshToken: 'refresh',
      user,
      accessTokenExpiresAt: 1_900_000_000_000,
      sessionStartedAt: 1_800_000_000_000,
    });
  });

  it('is a guest, with no start time, when the storage has no session', async () => {
    const identity = await readSessionIdentity({
      readPersistedSession: async () => null,
      now: () => 1_800_000_000_000,
    });
    assert.deepEqual(identity, GUEST_IDENTITY);
    assert.equal(identity.sessionStartedAt, null);
  });

  it('U-17: leaves a guest, instead of hanging on hydrating, when reading the session throws', async () => {
    const identity = await readSessionIdentity({
      readPersistedSession: async () => {
        throw new Error('GeneralSecurityException');
      },
      now: () => 1_800_000_000_000,
    });
    assert.deepEqual(identity, GUEST_IDENTITY);
  });

  it('is a guest when the reader fails before it returns a promise', async () => {
    const identity = await readSessionIdentity({
      readPersistedSession: () => {
        throw new SyntaxError('Unexpected token');
      },
      now: () => 1,
    });
    assert.deepEqual(identity, GUEST_IDENTITY);
  });

  it('builds the authenticated identity from a persisted session', () => {
    assert.equal(authenticatedIdentity(persisted, 5).sessionStartedAt, 5);
  });
});

describe('clearSessionIdentity', () => {
  it('U-11: runs the clean-up handlers and leaves a guest even when the session keys cannot be deleted', async () => {
    const events: string[] = [];
    let applied: unknown = null;
    const off = onSessionCleared(() => void events.push('handler'));

    await clearSessionIdentity({
      clearPersistedSession: async () => {
        events.push('persisted');
        throw new Error('keychain locked');
      },
      runClearedHandlers: runSessionClearedHandlers,
      apply: (identity) => {
        events.push('apply');
        applied = identity;
      },
    });
    off();

    assert.deepEqual(events, ['persisted', 'handler', 'apply']);
    assert.deepEqual(applied, {
      status: 'guest',
      accessToken: null,
      refreshToken: null,
      user: null,
      accessTokenExpiresAt: null,
      sessionStartedAt: null,
    });
  });

  it('does not reject when the session keys cannot be deleted, so no caller is left with an unhandled error', async () => {
    await assert.doesNotReject(
      clearSessionIdentity({
        clearPersistedSession: async () => {
          throw new Error('keychain locked');
        },
        runClearedHandlers: async () => undefined,
        apply: () => undefined,
      }),
    );
  });

  it('deletes the session keys first, then the handlers, then changes the state', async () => {
    const events: string[] = [];
    await clearSessionIdentity({
      clearPersistedSession: async () => void events.push('persisted'),
      runClearedHandlers: async () => void events.push('handlers'),
      apply: () => void events.push('apply'),
    });
    assert.deepEqual(events, ['persisted', 'handlers', 'apply']);
  });

  it('waits for the asynchronous handlers before it changes the state', async () => {
    let handlersDone = false;
    let doneWhenApplied = false;
    await clearSessionIdentity({
      clearPersistedSession: async () => undefined,
      runClearedHandlers: async () => {
        await new Promise<void>((resolve) => setTimeout(resolve, 15));
        handlersDone = true;
      },
      apply: () => {
        doneWhenApplied = handlersDone;
      },
    });
    assert.equal(doneWhenApplied, true);
  });

  it('still leaves a guest when a handler itself fails', async () => {
    let applied = false;
    await assert.doesNotReject(
      clearSessionIdentity({
        clearPersistedSession: async () => undefined,
        runClearedHandlers: async () => {
          throw new Error('handler');
        },
        apply: () => {
          applied = true;
        },
      }),
    );
    assert.equal(applied, true);
  });

  it('leaves a guest when the deletion throws before it returns a promise', async () => {
    let applied = false;
    await clearSessionIdentity({
      clearPersistedSession: () => {
        throw new Error('sync failure');
      },
      runClearedHandlers: async () => undefined,
      apply: () => {
        applied = true;
      },
    });
    assert.equal(applied, true);
  });
});

describe('useSessionStore keeps the contract of the session lifecycle', () => {
  const source = readFileSync(new URL('./useSessionStore.ts', import.meta.url), 'utf8');

  function block(from: string, to: string): string {
    const start = source.indexOf(from);
    const end = source.indexOf(to, start);
    assert.ok(start >= 0 && end > start, `${from} block is present`);
    return source.slice(start, end);
  }

  it('hydrate never deletes anything: it only reads (C-12)', () => {
    const hydrate = block('hydrate: async', 'setSession: async');
    assert.doesNotMatch(hydrate, /clearPersistedSession|deleteItem|removeItem/);
  });

  it('a token refresh is not a new session: setTokens leaves the start time alone (R-3)', () => {
    const setTokens = block('setTokens: async', 'clearSession: async');
    assert.doesNotMatch(setTokens, /sessionStartedAt/);
  });

  it('a new session stamps its start time', () => {
    const setSession = block('setSession: async', 'setTokens: async');
    assert.match(setSession, /sessionStartedAt/);
  });

  it('delegates the clean-up to the tested function, so the state always ends as a guest (C-5)', () => {
    const clearSession = source.slice(source.indexOf('clearSession: async'));
    assert.match(clearSession, /clearSessionIdentity/);
  });
});

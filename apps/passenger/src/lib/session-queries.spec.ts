import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { shouldPurgeSessionQueries } from './session-queries.ts';

describe('shouldPurgeSessionQueries (R-2)', () => {
  it('purges when the session ends', () => {
    assert.equal(
      shouldPurgeSessionQueries(
        { authenticated: true, userId: 7 },
        { authenticated: false, userId: null },
      ),
      true,
    );
  });

  it('purges when the user changes without going through a guest state', () => {
    assert.equal(
      shouldPurgeSessionQueries(
        { authenticated: true, userId: 7 },
        { authenticated: true, userId: 8 },
      ),
      true,
    );
  });

  it('does not purge while the same user keeps the session, as with a token refresh', () => {
    assert.equal(
      shouldPurgeSessionQueries(
        { authenticated: true, userId: 7 },
        { authenticated: true, userId: 7 },
      ),
      false,
    );
  });

  it('does not purge when a session starts, after hydrating or after signing in', () => {
    assert.equal(
      shouldPurgeSessionQueries(
        { authenticated: false, userId: null },
        { authenticated: true, userId: 7 },
      ),
      false,
    );
  });

  it('does not purge while nobody is signed in', () => {
    assert.equal(
      shouldPurgeSessionQueries(
        { authenticated: false, userId: null },
        { authenticated: false, userId: null },
      ),
      false,
    );
  });
});

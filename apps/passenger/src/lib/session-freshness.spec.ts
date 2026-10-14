import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { isSessionFresh } from './session-freshness.ts';

describe('isSessionFresh (R-3)', () => {
  it('rejects a response obtained before the session started', () => {
    assert.equal(isSessionFresh(999, 1000), false);
  });

  it('accepts a response obtained at the same instant or after the session started', () => {
    assert.equal(isSessionFresh(1000, 1000), true);
    assert.equal(isSessionFresh(1001, 1000), true);
  });

  it('rejects everything when there is no session', () => {
    assert.equal(isSessionFresh(5000, null), false);
  });

  it('rejects a response that was never obtained', () => {
    assert.equal(isSessionFresh(0, 0), false);
    assert.equal(isSessionFresh(0, 1000), false);
  });
});

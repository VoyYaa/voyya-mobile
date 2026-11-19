import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { DemoSession } from '@voyyaa/shared';
import { demoSessionOf, isDemoSession } from './demo-session.ts';

const DEMO: DemoSession = {
  municipality_id: 1,
  municipality_name: 'Villa Demo',
  center: { lat: 1.5, lng: 2.5 },
  places: [{ key: 'plaza-demo', name: 'Plaza Demo', lat: 1.5, lng: 2.5 }],
};

describe('demoSessionOf', () => {
  it('returns the demo session of a user that has one', () => {
    assert.equal(demoSessionOf({ demo_session: DEMO }), DEMO);
  });

  it('returns null for a real user, for no user and for an undefined user', () => {
    assert.equal(demoSessionOf({ demo_session: null }), null);
    assert.equal(demoSessionOf(null), null);
    assert.equal(demoSessionOf(undefined), null);
  });
});

describe('isDemoSession', () => {
  it('is true only when the server sent a demo session', () => {
    assert.equal(isDemoSession({ demo_session: DEMO }), true);
    assert.equal(isDemoSession({ demo_session: null }), false);
    assert.equal(isDemoSession(null), false);
  });
});

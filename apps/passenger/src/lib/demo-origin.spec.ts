import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { demoReferenceOrigin, isDemoReferenceOrigin, shouldSeedDemoOrigin } from './demo-origin.ts';
import { DEMO_FIXTURE } from './demo-fixtures.ts';

const SOME_ORIGIN = { address: 'Otro', lat: 1, lng: 2 };

describe('demoReferenceOrigin', () => {
  it('names the reference point of the municipality, never the current location', () => {
    const origin = demoReferenceOrigin(DEMO_FIXTURE);
    assert.equal(origin.address, 'Punto de referencia · Villa Demo');
    assert.doesNotMatch(origin.address, /Tu ubicación actual/);
    assert.deepEqual({ lat: origin.lat, lng: origin.lng }, DEMO_FIXTURE.center);
  });
});

describe('isDemoReferenceOrigin', () => {
  it('is true only for an origin on the center of a demo session', () => {
    assert.equal(isDemoReferenceOrigin(demoReferenceOrigin(DEMO_FIXTURE), DEMO_FIXTURE), true);
    assert.equal(isDemoReferenceOrigin(SOME_ORIGIN, DEMO_FIXTURE), false);
    assert.equal(isDemoReferenceOrigin(null, DEMO_FIXTURE), false);
    assert.equal(isDemoReferenceOrigin(demoReferenceOrigin(DEMO_FIXTURE), null), false);
  });
});

describe('shouldSeedDemoOrigin', () => {
  const base = {
    demo: DEMO_FIXTURE,
    origin: null,
    alreadySeeded: false,
    activeTripKnown: true,
    hasActiveTrip: false,
  };

  it('seeds the reference point once the active trip is known to be absent', () => {
    assert.equal(shouldSeedDemoOrigin(base), true);
  });

  it('never seeds a real session (CA-DX-1)', () => {
    assert.equal(shouldSeedDemoOrigin({ ...base, demo: null }), false);
  });

  it('does not seed twice, so clearing the origin shows the no-origin panel', () => {
    assert.equal(shouldSeedDemoOrigin({ ...base, alreadySeeded: true }), false);
  });

  it('does not overwrite an origin', () => {
    assert.equal(shouldSeedDemoOrigin({ ...base, origin: SOME_ORIGIN }), false);
  });

  it('waits for the active trip and skips it when there is one', () => {
    assert.equal(shouldSeedDemoOrigin({ ...base, activeTripKnown: false }), false);
    assert.equal(shouldSeedDemoOrigin({ ...base, hasActiveTrip: true }), false);
  });
});

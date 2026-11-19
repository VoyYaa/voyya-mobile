import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isLocationOffWithManualOrigin } from './location-off-banner.ts';

const BASE = {
  originSource: 'manual' as const,
  hasOrigin: true,
  servicesEnabled: false as boolean | null,
  tripActive: false,
};

describe('isLocationOffWithManualOrigin', () => {
  it('shows when the origin was marked by hand and the location is off', () => {
    assert.equal(isLocationOffWithManualOrigin(BASE), true);
  });

  it('does not show when the origin came from the GPS', () => {
    assert.equal(isLocationOffWithManualOrigin({ ...BASE, originSource: 'gps' }), false);
  });

  it('does not show while the location is on or not yet known', () => {
    assert.equal(isLocationOffWithManualOrigin({ ...BASE, servicesEnabled: true }), false);
    assert.equal(isLocationOffWithManualOrigin({ ...BASE, servicesEnabled: null }), false);
  });

  it('never shows in a demo session, whatever the state of the GPS (CA-DX-7)', () => {
    assert.equal(isLocationOffWithManualOrigin({ ...BASE, demo: true }), false);
    assert.equal(isLocationOffWithManualOrigin({ ...BASE, demo: false }), true);
  });

  it('does not show without an origin or with a trip in progress', () => {
    assert.equal(isLocationOffWithManualOrigin({ ...BASE, hasOrigin: false }), false);
    assert.equal(isLocationOffWithManualOrigin({ ...BASE, tripActive: true }), false);
  });
});

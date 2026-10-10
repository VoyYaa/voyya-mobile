import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { toBounds, toLatLng, toPosition } from './geo.ts';

describe('toBounds', () => {
  it('encloses every point, with the north east corner first', () => {
    const bounds = toBounds([
      { lat: 6.96, lng: -75.41 },
      { lat: 6.98, lng: -75.43 },
      { lat: 6.95, lng: -75.4 },
    ]);
    assert.deepEqual(bounds, { ne: [-75.4, 6.98], sw: [-75.43, 6.95] });
  });

  it('collapses to a single point', () => {
    const bounds = toBounds([{ lat: 6.96, lng: -75.41 }]);
    assert.deepEqual(bounds, { ne: [-75.41, 6.96], sw: [-75.41, 6.96] });
  });

  it('has no bounds without points', () => {
    assert.equal(toBounds([]), null);
  });
});

describe('position helpers', () => {
  it('swaps to longitude first and back', () => {
    assert.deepEqual(toPosition({ lat: 6.96, lng: -75.41 }), [-75.41, 6.96]);
    assert.deepEqual(toLatLng([-75.41, 6.96]), { lat: 6.96, lng: -75.41 });
    assert.equal(toLatLng([Number.NaN, 1]), null);
  });
});

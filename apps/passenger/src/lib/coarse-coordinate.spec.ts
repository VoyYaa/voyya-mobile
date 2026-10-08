import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { toCoarseCoordinate } from './coarse-coordinate.ts';

describe('toCoarseCoordinate', () => {
  it('rounds both axes to 3 decimals', () => {
    assert.deepEqual(toCoarseCoordinate({ lat: 6.963412, lng: -75.417896 }), {
      lat: 6.963,
      lng: -75.418,
    });
  });

  it('keeps coordinates that already have 3 decimals or fewer', () => {
    assert.deepEqual(toCoarseCoordinate({ lat: 6.96, lng: -75.418 }), { lat: 6.96, lng: -75.418 });
  });

  it('does not mutate the input', () => {
    const input = { lat: 6.963412, lng: -75.417896 };
    toCoarseCoordinate(input);
    assert.deepEqual(input, { lat: 6.963412, lng: -75.417896 });
  });

  it('never yields negative zero', () => {
    assert.equal(Object.is(toCoarseCoordinate({ lat: -0.0001, lng: 0 }).lat, 0), true);
  });
});

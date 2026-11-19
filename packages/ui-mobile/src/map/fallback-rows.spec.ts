import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { fallbackRows, hasRouteSchematic } from './fallback-rows.ts';
import type { MapMarker } from './types.ts';

const ORIGIN: MapMarker = {
  id: 'o',
  kind: 'origin',
  coord: { lat: 6.96171, lng: -75.4185 },
  label: 'Tu ubicación actual',
};
const DESTINATION: MapMarker = {
  id: 'd',
  kind: 'destination',
  coord: { lat: 6.97, lng: -75.42 },
  label: 'Hospital',
};
const CAR: MapMarker = {
  id: 'c',
  kind: 'car',
  coord: { lat: 6.96, lng: -75.41 },
  label: 'Hace 1 min',
};

describe('fallbackRows', () => {
  it('writes one row per labeled marker with its role', () => {
    assert.deepEqual(fallbackRows([ORIGIN, DESTINATION, CAR]), [
      { id: 'o', text: 'Recogida: Tu ubicación actual' },
      { id: 'd', text: 'Destino: Hospital' },
      { id: 'c', text: 'Tu conductor: Hace 1 min' },
    ]);
  });

  it('omits a marker without a label and never prints coordinates', () => {
    const rows = fallbackRows([
      { ...ORIGIN, label: undefined },
      { ...DESTINATION, label: '  ' },
    ]);
    assert.deepEqual(rows, []);
    for (const row of fallbackRows([ORIGIN, DESTINATION, CAR])) {
      assert.doesNotMatch(row.text, /-?\d+\.\d{3,}/);
    }
  });

  it('has no rows without markers', () => {
    assert.deepEqual(fallbackRows(undefined), []);
  });
});

describe('hasRouteSchematic', () => {
  it('needs both an origin and a destination', () => {
    assert.equal(hasRouteSchematic([ORIGIN, DESTINATION]), true);
    assert.equal(hasRouteSchematic([ORIGIN, CAR]), false);
    assert.equal(hasRouteSchematic(undefined), false);
  });
});

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { demoPlaceToVerifiedPlace, demoPlacesState } from './demo-places.ts';
import { DEMO_FIXTURE, EMPTY_DEMO_FIXTURE } from './demo-fixtures.ts';

const hookSource = readFileSync(
  new URL('../hooks/usePlacesAvailability.ts', import.meta.url),
  'utf8',
);

describe('demoPlaceToVerifiedPlace', () => {
  it('prefixes the key, keeps the name and always carries a coordinate', () => {
    assert.deepEqual(demoPlaceToVerifiedPlace(DEMO_FIXTURE.places[0]!), {
      id: 'demo-plaza-demo',
      title: 'Plaza Demo',
      category: 'general',
      coord: { lat: 10.25, lng: -20.5 },
    });
  });
});

describe('demoPlacesState', () => {
  it('lists only the places of the demo session, titled with its municipality', () => {
    const state = demoPlacesState(DEMO_FIXTURE);
    assert.equal(state.availability, 'verified');
    assert.equal(state.municipalityName, 'Villa Demo');
    assert.deepEqual(
      state.places.map((place) => place.id),
      ['demo-plaza-demo', 'demo-clinica-demo'],
    );
    assert.ok(state.places.every((place) => place.coord !== null));
  });

  it('falls to the elsewhere state with an empty list, so the pin keeps working', () => {
    const state = demoPlacesState(EMPTY_DEMO_FIXTURE);
    assert.equal(state.availability, 'elsewhere');
    assert.deepEqual(state.places, []);
  });
});

describe('place hooks in a demo session (CA-DX-4)', () => {
  it('return the demo list before looking at the registry, with or without a pin', () => {
    const pickup = hookSource.slice(hookSource.indexOf('export function usePickupPlaces'));
    const pickupBody = pickup.slice(0, pickup.indexOf('export function usePinPlaces'));
    assert.match(pickupBody, /if \(demoPlaces !== null\) return demoPlaces;/);
    const pin = hookSource.slice(hookSource.indexOf('export function usePinPlaces'));
    assert.ok(
      pin.indexOf('if (demoPlaces !== null) return demoPlaces;') < pin.indexOf('everywhere'),
    );
  });

  it('stop the pin query in demo, so no coordinate of the reviewer leaves the phone', () => {
    assert.match(hookSource, /CAN_PIN_DROP && demo === null \? pin : null/);
  });
});

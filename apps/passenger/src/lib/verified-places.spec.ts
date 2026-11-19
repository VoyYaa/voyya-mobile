import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { placesAvailability } from './verified-places.ts';
import {
  VERIFIED_PLACES_BY_MUNICIPALITY,
  allVerifiedPlaces,
  normalizeMunicipalityName,
  placesFor,
  type PlaceRegistry,
} from '../constants/verified-places/registry.ts';
import { YARUMAL_PLACES } from '../constants/verified-places/yarumal.ts';

const TEST_REGISTRY: PlaceRegistry = {
  envigado: [{ id: 'test-plaza', title: 'Plaza de prueba', category: 'plaza', coord: null }],
};

describe('normalizeMunicipalityName', () => {
  it('ignores case, accents and surrounding spaces', () => {
    assert.equal(normalizeMunicipalityName(' ENVIGADÓ '), 'envigado');
    assert.equal(normalizeMunicipalityName('Yarumal'), 'yarumal');
  });
});

describe('placesFor', () => {
  it('returns the places of a municipality, ignoring case and accents', () => {
    assert.equal(placesFor('Yarumal'), YARUMAL_PLACES);
    assert.equal(placesFor(' YARUMAL '), YARUMAL_PLACES);
  });

  it('has no entry for a municipality outside the registry', () => {
    assert.equal(placesFor('Envigado'), null);
  });

  it('has no entry without a name', () => {
    assert.equal(placesFor(null), null);
  });

  it('reads a test entry of another municipality from an injected registry', () => {
    assert.equal(placesFor('Envigado', TEST_REGISTRY), TEST_REGISTRY['envigado']);
    assert.equal(placesFor('Yarumal', TEST_REGISTRY), null);
  });
});

describe('registry integrity', () => {
  it('keeps every key already normalized, so no two names collapse into one entry', () => {
    for (const key of Object.keys(VERIFIED_PLACES_BY_MUNICIPALITY)) {
      assert.equal(key, normalizeMunicipalityName(key));
    }
  });

  it('never repeats a place id across municipalities', () => {
    const ids = allVerifiedPlaces().map((place) => place.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  it('never repeats a place title inside a municipality', () => {
    for (const places of Object.values(VERIFIED_PLACES_BY_MUNICIPALITY)) {
      const titles = places.map((place) => place.title);
      assert.equal(new Set(titles).size, titles.length);
    }
  });

  it('keeps places without a verified coordinate as pending, never with an invented one', () => {
    const pending = YARUMAL_PLACES.filter((place) => place.coord === null).map((place) => place.id);
    assert.deepEqual(pending, ['hospital-san-juan-de-dios', 'alcaldia', 'terminal']);
  });

  it('names no municipality in a place title', () => {
    for (const place of allVerifiedPlaces()) {
      assert.doesNotMatch(place.title, /yarumal/i);
    }
  });
});

describe('allVerifiedPlaces', () => {
  it('lists the places of every registered municipality', () => {
    assert.deepEqual(allVerifiedPlaces(TEST_REGISTRY), TEST_REGISTRY['envigado']);
  });
});

describe('placesAvailability', () => {
  it('is unknown while the municipality has not been resolved', () => {
    assert.equal(placesAvailability(undefined), 'unknown');
  });

  it('is verified when the municipality has an entry, ignoring case and accents', () => {
    assert.equal(placesAvailability({ municipality: { name: 'Yarumal' } }), 'verified');
    assert.equal(placesAvailability({ municipality: { name: ' YARUMAL ' } }), 'verified');
  });

  it('is elsewhere in a municipality with no entry', () => {
    assert.equal(placesAvailability({ municipality: { name: 'Envigado' } }), 'elsewhere');
  });

  it('is elsewhere when the pin is outside every covered municipality', () => {
    assert.equal(placesAvailability({ municipality: null }), 'elsewhere');
  });

  it('turns verified for another municipality just by adding an entry', () => {
    assert.equal(
      placesAvailability({ municipality: { name: 'Envigado' } }, TEST_REGISTRY),
      'verified',
    );
  });
});

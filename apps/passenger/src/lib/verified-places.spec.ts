import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { placesAvailability } from './verified-places.ts';

describe('placesAvailability', () => {
  it('is unknown while the municipality has not been resolved', () => {
    assert.equal(placesAvailability(undefined), 'unknown');
  });

  it('is verified when the pin is in Yarumal, ignoring case and accents', () => {
    assert.equal(placesAvailability({ municipality: { name: 'Yarumal' } }), 'verified');
    assert.equal(placesAvailability({ municipality: { name: ' YARUMAL ' } }), 'verified');
  });

  it('is elsewhere in any other municipality', () => {
    assert.equal(placesAvailability({ municipality: { name: 'Envigado' } }), 'elsewhere');
  });

  it('is elsewhere when the pin is outside every covered municipality', () => {
    assert.equal(placesAvailability({ municipality: null }), 'elsewhere');
  });
});

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { buildDirectionsUrl } from './directions-url.ts';

describe('buildDirectionsUrl', () => {
  it('uses the geo scheme on Android', () => {
    assert.equal(
      buildDirectionsUrl('Calle 20 #24-10', 'Yarumal', 'android'),
      'geo:0,0?q=Calle%2020%20%2324-10%2C%20Yarumal',
    );
  });

  it('uses the maps scheme on iOS', () => {
    assert.equal(
      buildDirectionsUrl('Parque Principal', 'Yarumal', 'ios'),
      'maps:?q=Parque%20Principal%2C%20Yarumal',
    );
  });

  it('uses a web maps search on web', () => {
    assert.equal(
      buildDirectionsUrl('Parque Principal', null, 'web'),
      'https://www.google.com/maps/search/?api=1&query=Parque%20Principal',
    );
  });
});

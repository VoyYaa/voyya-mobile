import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { resolveMapStyleUrl } from './map-style.ts';

const STOCK = { light: 'stock://light', dark: 'stock://dark' };

describe('resolveMapStyleUrl', () => {
  it('uses the stock style when the variables are absent', () => {
    assert.equal(resolveMapStyleUrl('light', {}, STOCK), STOCK.light);
    assert.equal(resolveMapStyleUrl('dark', {}, STOCK), STOCK.dark);
  });

  it('uses the custom style of the requested mode when it is a valid Mapbox style URL', () => {
    const env = { light: 'mapbox://styles/acme/light1', dark: 'mapbox://styles/acme/dark1' };
    assert.equal(resolveMapStyleUrl('light', env, STOCK), env.light);
    assert.equal(resolveMapStyleUrl('dark', env, STOCK), env.dark);
  });

  it('falls back when only the other mode is defined', () => {
    assert.equal(
      resolveMapStyleUrl('dark', { light: 'mapbox://styles/acme/light1' }, STOCK),
      STOCK.dark,
    );
  });

  it('falls back for an empty, blank or malformed value', () => {
    for (const value of ['', '   ', 'https://example.com/style.json', 'mapbox://styles/acme']) {
      assert.equal(resolveMapStyleUrl('light', { light: value }, STOCK), STOCK.light, value);
    }
  });

  it('trims surrounding whitespace of a valid value', () => {
    assert.equal(
      resolveMapStyleUrl('light', { light: ' mapbox://styles/acme/light1 ' }, STOCK),
      'mapbox://styles/acme/light1',
    );
  });
});

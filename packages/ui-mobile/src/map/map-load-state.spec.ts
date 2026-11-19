import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { INITIAL_MAP_LOAD_STATE, reduceMapLoad } from './map-load-state.ts';

describe('reduceMapLoad', () => {
  it('starts loading and not degraded', () => {
    assert.deepEqual(INITIAL_MAP_LOAD_STATE, { ready: false, degraded: false });
  });

  it('is ready once the style loads', () => {
    assert.deepEqual(reduceMapLoad(INITIAL_MAP_LOAD_STATE, 'style_loaded'), {
      ready: true,
      degraded: false,
    });
  });

  it('degrades when loading fails, and stops showing the skeleton', () => {
    assert.deepEqual(reduceMapLoad(INITIAL_MAP_LOAD_STATE, 'failed'), {
      ready: true,
      degraded: true,
    });
  });

  it('degrades on timeout while still loading', () => {
    assert.deepEqual(reduceMapLoad(INITIAL_MAP_LOAD_STATE, 'timeout'), {
      ready: true,
      degraded: true,
    });
  });

  it('ignores a timeout once the map is ready', () => {
    const ready = reduceMapLoad(INITIAL_MAP_LOAD_STATE, 'style_loaded');
    assert.deepEqual(reduceMapLoad(ready, 'timeout'), ready);
  });

  it('keeps the degraded flag when only the style loads after a failure', () => {
    const failed = reduceMapLoad(INITIAL_MAP_LOAD_STATE, 'failed');
    assert.equal(reduceMapLoad(failed, 'style_loaded').degraded, true);
  });

  it('recovers when the map renders fully', () => {
    const failed = reduceMapLoad(INITIAL_MAP_LOAD_STATE, 'failed');
    assert.deepEqual(reduceMapLoad(failed, 'fully_rendered'), { ready: true, degraded: false });
  });
});

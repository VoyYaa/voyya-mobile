import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { resolveBannerA11y, selectBanner } from './status-banner.ts';

describe('resolveBannerA11y', () => {
  it('uses an alert for a danger banner', () => {
    assert.deepEqual(resolveBannerA11y('danger'), { role: 'alert', liveRegion: 'assertive' });
  });

  it('uses a polite status for informative and warning banners', () => {
    assert.deepEqual(resolveBannerA11y('info'), { role: 'status', liveRegion: 'polite' });
    assert.deepEqual(resolveBannerA11y('warning'), { role: 'status', liveRegion: 'polite' });
  });

  it('lets a blocking warning ask for an alert', () => {
    assert.deepEqual(resolveBannerA11y('warning', 'alert'), {
      role: 'alert',
      liveRegion: 'assertive',
    });
  });
});

describe('selectBanner', () => {
  it('prefers offline over location over notices', () => {
    assert.equal(selectBanner(['notice', 'location', 'offline']), 'offline');
    assert.equal(selectBanner(['notice', 'location']), 'location');
    assert.equal(selectBanner(['notice']), 'notice');
  });

  it('shows nothing when no condition is active', () => {
    assert.equal(selectBanner([]), null);
  });
});

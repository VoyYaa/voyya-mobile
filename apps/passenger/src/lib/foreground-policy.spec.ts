import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { foregroundPresentation, isTripScreenPath } from './foreground-policy.ts';

describe('isTripScreenPath', () => {
  it('recognizes the two screens that show the trip', () => {
    assert.equal(isTripScreenPath('/searching'), true);
    assert.equal(isTripScreenPath('/driver-assigned'), true);
  });

  it('does not treat any other screen as the trip', () => {
    for (const path of [
      '/',
      '/privacy',
      '/confirm',
      '/destination',
      '/phone',
      '/(auth)/phone',
      '',
    ]) {
      assert.equal(isTripScreenPath(path), false, path);
    }
  });
});

describe('foregroundPresentation', () => {
  it('shows no banner, no list entry and no sound while the trip screen is visible', () => {
    for (const path of ['/searching', '/driver-assigned']) {
      assert.deepEqual(foregroundPresentation(path), {
        shouldShowAlert: false,
        shouldPlaySound: false,
        shouldSetBadge: false,
      });
    }
  });

  it('shows the system notification with sound on any other screen, as the owner decided', () => {
    for (const path of ['/', '/privacy', '/confirm', '/destination']) {
      assert.deepEqual(foregroundPresentation(path), {
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      });
    }
  });
});

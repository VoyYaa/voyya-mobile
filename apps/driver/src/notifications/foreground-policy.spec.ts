import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { DRIVER_FOREGROUND_PRESENTATION } from './foreground-policy.ts';

describe('DRIVER_FOREGROUND_PRESENTATION', () => {
  it('shows the offer as a banner and in the list with sound and without a badge', () => {
    assert.deepEqual(DRIVER_FOREGROUND_PRESENTATION, {
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    });
  });
});

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { driverCopy } from './driver-copy.ts';
import { NO_BREAK_SPACE, formatMeters } from './format-distance.ts';

describe('formatMeters', () => {
  it('keeps the unit glued to the number so it never wraps alone', () => {
    assert.equal(formatMeters(142), `142${NO_BREAK_SPACE}m`);
    assert.ok(!formatMeters(142).includes(' '));
  });

  it('is used by every offer line that shows the pickup distance', () => {
    assert.ok(driverCopy.offer.banner(142, 'Centro').includes(formatMeters(142)));
    assert.ok(driverCopy.offer.pickupValue('Parque', 142).endsWith(formatMeters(142)));
  });
});

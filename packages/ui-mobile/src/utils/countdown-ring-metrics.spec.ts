import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { countdownRingMetrics } from './countdown-ring-metrics.ts';

describe('countdownRingMetrics', () => {
  it('hides the unit and freezes the font scale in the compact ring', () => {
    assert.deepEqual(countdownRingMetrics(72), {
      compact: true,
      numberSize: 21,
      showUnit: false,
      fontScaleCap: 1,
    });
  });

  it('keeps the unit and allows a capped scale in a regular ring', () => {
    assert.deepEqual(countdownRingMetrics(168), {
      compact: false,
      numberSize: 49,
      showUnit: true,
      fontScaleCap: 1.3,
    });
  });

  it('treats the minimum regular size as not compact', () => {
    assert.equal(countdownRingMetrics(96).compact, false);
    assert.equal(countdownRingMetrics(95).compact, true);
  });
});

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ORNAMENT_MARGIN_DP, ornamentPositions } from './ornament-layout.ts';

describe('ornamentPositions', () => {
  it('keeps the base margin when nothing covers the map', () => {
    const { logo, attribution } = ornamentPositions();
    assert.deepEqual(logo, { left: ORNAMENT_MARGIN_DP, bottom: ORNAMENT_MARGIN_DP });
    assert.deepEqual(attribution, { right: ORNAMENT_MARGIN_DP, bottom: ORNAMENT_MARGIN_DP });
  });

  it('lifts the logo and the attribution above the part of the map a sheet covers', () => {
    const { logo, attribution } = ornamentPositions(28);
    assert.equal(logo.bottom, ORNAMENT_MARGIN_DP + 28);
    assert.equal(attribution.bottom, ORNAMENT_MARGIN_DP + 28);
  });

  it('ignores a negative or fractional cover', () => {
    assert.equal(ornamentPositions(-10).logo.bottom, ORNAMENT_MARGIN_DP);
    assert.equal(ornamentPositions(27.6).logo.bottom, ORNAMENT_MARGIN_DP + 28);
  });
});

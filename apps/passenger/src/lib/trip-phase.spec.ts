import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { PassengerUiState } from '@voyyaa/shared';

import { tripPhaseOf, type TripPhase } from './trip-phase.ts';

const EXPECTED: ReadonlyArray<readonly [PassengerUiState, TripPhase]> = [
  ['calculating_fare', 'searching'],
  ['searching', 'searching'],
  ['driver_assigned', 'assigned'],
  ['driver_en_route', 'en_route'],
  ['driver_waiting', 'arrived'],
  ['trip_in_progress', 'in_progress'],
  ['trip_completed', 'ended'],
  ['trip_no_show', 'ended'],
  ['trip_cancelled', 'ended'],
  ['no_driver', 'ended'],
  ['out_of_coverage', 'ended'],
  ['offline', 'ended'],
];

describe('tripPhaseOf', () => {
  for (const [ui, phase] of EXPECTED) {
    it(`maps ${ui} to ${phase}`, () => {
      assert.equal(tripPhaseOf({ ui }), phase);
    });
  }

  it('is ended while the trip state is unknown, so nothing about notifications shows early', () => {
    assert.equal(tripPhaseOf(undefined), 'ended');
  });
});

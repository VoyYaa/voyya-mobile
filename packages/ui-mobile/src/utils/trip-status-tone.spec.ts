import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { CASH_PENDING_TONE, tripStatusTone, type TripStatusValue } from './trip-status-tone.ts';

const ALL_STATUSES: readonly TripStatusValue[] = [
  'pending_assignment',
  'assigned',
  'driver_en_route',
  'in_progress',
  'completed',
  'cancelled_by_passenger',
  'cancelled_by_driver',
  'no_driver',
  'no_show',
  'expired',
];

describe('tripStatusTone', () => {
  it('covers every trip status with a non-empty label', () => {
    for (const status of ALL_STATUSES) {
      const result = tripStatusTone(status);
      assert.ok(result.label.length > 0, status);
    }
  });

  it('pulses only while searching for a driver', () => {
    const pulsing = ALL_STATUSES.filter((status) => tripStatusTone(status).pulse);
    assert.deepEqual(pulsing, ['pending_assignment']);
  });

  it('turns an en route trip into Llegó when the driver arrived', () => {
    assert.deepEqual(tripStatusTone('driver_en_route', { arrived: true }), {
      tone: 'success',
      label: 'Llegó',
      pulse: false,
    });
    assert.equal(tripStatusTone('driver_en_route').label, 'En camino');
  });

  it('keeps both cancellations under the same neutral label', () => {
    assert.equal(tripStatusTone('cancelled_by_passenger').label, 'Cancelado');
    assert.equal(tripStatusTone('cancelled_by_driver').tone, 'neutral');
  });

  it('marks pending cash with the warning tone', () => {
    assert.equal(CASH_PENDING_TONE.tone, 'warning');
  });
});

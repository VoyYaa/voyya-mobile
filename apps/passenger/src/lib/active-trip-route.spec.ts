import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { TripRequestStatus } from '@voyyaa/shared';

import { activeTripRoute } from './active-trip-route.ts';

function trip(status: TripRequestStatus['status']): TripRequestStatus {
  return {
    trip_request_id: 77,
    status,
    ui: 'searching',
    fare: { total: 8000 },
    driver: null,
    arrived_at: null,
    updated_at: '2026-10-08T12:00:00.000Z',
  } as TripRequestStatus;
}

describe('activeTripRoute', () => {
  it('sends a pending trip to the search screen', () => {
    assert.deepEqual(activeTripRoute(trip('pending_assignment')), {
      pathname: '/searching',
      params: { id: '77' },
    });
  });

  for (const status of ['assigned', 'driver_en_route', 'in_progress'] as const) {
    it(`sends ${status} to the trip screen`, () => {
      assert.deepEqual(activeTripRoute(trip(status)), {
        pathname: '/driver-assigned',
        params: { id: '77' },
      });
    });
  }

  it('never routes a terminal trip', () => {
    assert.equal(activeTripRoute(trip('completed')), null);
    assert.equal(activeTripRoute(trip('cancelled_by_passenger')), null);
  });
});

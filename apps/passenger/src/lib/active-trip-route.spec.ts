import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { TripRequestStatus } from '@voyyaa/shared';

import { activeTripRoute, isSameTripRoute } from './active-trip-route.ts';

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

describe('isSameTripRoute', () => {
  const route = { pathname: '/searching', params: { id: '77' } } as const;

  it('is the same when the pathname and the trip id match, so nothing is navigated or restarted', () => {
    assert.equal(isSameTripRoute({ pathname: '/searching', id: '77' }, route), true);
  });

  it('is different for another screen or another trip', () => {
    assert.equal(isSameTripRoute({ pathname: '/driver-assigned', id: '77' }, route), false);
    assert.equal(isSameTripRoute({ pathname: '/searching', id: '78' }, route), false);
    assert.equal(isSameTripRoute({ pathname: '/searching', id: undefined }, route), false);
    assert.equal(isSameTripRoute({ pathname: '/', id: undefined }, route), false);
  });
});

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { TripRequestStatus } from '@voyyaa/shared';

import { activeTripRoute, isSameTripRoute, savedTripRoute } from './active-trip-route.ts';
import { START_CODE_RECORD_VERSION, type StartCodeRecord } from './start-code-record.ts';

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

describe('savedTripRoute', () => {
  const record: StartCodeRecord = {
    version: START_CODE_RECORD_VERSION,
    trip_request_id: 41,
    user_id: 7,
    start_code: '4821',
    saved_at: 1_800_000_000_000,
  };

  it('opens the trip screen with the trip id and the saved source, and nothing else', () => {
    assert.deepEqual(savedTripRoute(record), {
      pathname: '/driver-assigned',
      params: { id: '41', source: 'saved' },
    });
  });

  it('never carries the code, the user or the time in the route (C-8)', () => {
    const serialized = JSON.stringify(savedTripRoute(record));
    assert.doesNotMatch(serialized, /4821/);
    assert.doesNotMatch(serialized, /user|start_code|saved_at|1800000000000/);
    assert.deepEqual(Object.keys(savedTripRoute(record).params).sort(), ['id', 'source']);
  });

  it('counts as the same route as the open trip screen, so a tap does not navigate twice', () => {
    assert.equal(
      isSameTripRoute({ pathname: '/driver-assigned', id: '41' }, savedTripRoute(record)),
      true,
    );
    assert.equal(
      isSameTripRoute({ pathname: '/driver-assigned', id: '42' }, savedTripRoute(record)),
      false,
    );
  });
});

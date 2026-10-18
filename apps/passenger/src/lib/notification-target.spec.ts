import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { TripRequestStatus } from '@voyyaa/shared';

import {
  NOTIFICATION_STALE_AFTER_MS,
  isNotOwnedOrMissing,
  resolveNotificationTarget,
  type NotificationTargetApi,
  type ResolveNotificationInput,
} from './notification-target.ts';

function trip(status: TripRequestStatus['status'], tripRequestId = 77): TripRequestStatus {
  return {
    trip_request_id: tripRequestId,
    status,
    ui: 'searching',
    fare: { total: 8000 },
    driver: null,
    arrived_at: null,
    updated_at: '2026-10-13T12:00:00.000Z',
  } as TripRequestStatus;
}

function httpError(status: number): { kind: 'http'; status: number } {
  return { kind: 'http', status };
}

interface Harness {
  api: NotificationTargetApi;
  lookedUp: number[];
  activeCalls: { count: number };
}

function createApi(options: {
  active?: TripRequestStatus | null | Error | { kind: string; status?: number };
  trips?: Record<number, TripRequestStatus | { kind: string; status?: number }>;
}): Harness {
  const lookedUp: number[] = [];
  const activeCalls = { count: 0 };
  const api: NotificationTargetApi = {
    getActiveTrip: async () => {
      activeCalls.count += 1;
      const active = options.active === undefined ? null : options.active;
      if (active !== null && ('kind' in active || active instanceof Error)) throw active;
      return active as TripRequestStatus | null;
    },
    getTrip: async (tripRequestId) => {
      lookedUp.push(tripRequestId);
      const found = options.trips?.[tripRequestId];
      if (found === undefined) throw httpError(404);
      if ('kind' in found) throw found;
      return found;
    },
  };
  return { api, lookedUp, activeCalls };
}

function input(overrides: Partial<ResolveNotificationInput> = {}): ResolveNotificationInput {
  return {
    authenticated: true,
    rawData: { type: 'trip_no_driver', trip_request_id: 77 },
    ageMs: 1000,
    ...overrides,
  };
}

describe('resolveNotificationTarget', () => {
  describe('without a session', () => {
    it('does not use the notification and asks the server nothing', async () => {
      const h = createApi({});
      const target = await resolveNotificationTarget(h.api, input({ authenticated: false }));
      assert.deepEqual(target, { kind: 'skip' });
      assert.equal(h.activeCalls.count, 0);
      assert.deepEqual(h.lookedUp, []);
    });
  });

  describe('with an active trip', () => {
    it('goes to the search screen while the trip is pending', async () => {
      const active = trip('pending_assignment');
      const target = await resolveNotificationTarget(createApi({ active }).api, input());
      assert.deepEqual(target, {
        kind: 'route',
        route: { pathname: '/searching', params: { id: '77' } },
        trip: active,
      });
    });

    for (const status of ['assigned', 'driver_en_route', 'in_progress'] as const) {
      it(`goes to the trip screen when the trip is ${status}`, async () => {
        const active = trip(status);
        const target = await resolveNotificationTarget(createApi({ active }).api, input());
        assert.deepEqual(target, {
          kind: 'route',
          route: { pathname: '/driver-assigned', params: { id: '77' } },
          trip: active,
        });
      });
    }

    it('shows the current state, not the one in the notification, and never asks for the hinted trip', async () => {
      const active = trip('driver_en_route', 91);
      const h = createApi({ active });
      const target = await resolveNotificationTarget(
        h.api,
        input({ rawData: { type: 'trip_no_driver', trip_request_id: 77 } }),
      );
      assert.deepEqual(target, {
        kind: 'route',
        route: { pathname: '/driver-assigned', params: { id: '91' } },
        trip: active,
      });
      assert.deepEqual(h.lookedUp, []);
    });

    it('goes to the active trip even when the notification is old or has a broken payload', async () => {
      const active = trip('assigned');
      const old = await resolveNotificationTarget(
        createApi({ active }).api,
        input({ ageMs: NOTIFICATION_STALE_AFTER_MS * 10 }),
      );
      assert.equal(old.kind, 'route');
      const broken = await resolveNotificationTarget(
        createApi({ active }).api,
        input({ rawData: { garbage: true } }),
      );
      assert.equal(broken.kind, 'route');
    });
  });

  describe('without an active trip', () => {
    it('shows the result of a trip the driver cancelled when the hint is the passenger own', async () => {
      const ended = trip('cancelled_by_driver');
      const target = await resolveNotificationTarget(
        createApi({ trips: { 77: ended } }).api,
        input({ rawData: { type: 'trip_driver_cancelled_ended', trip_request_id: 77 } }),
      );
      assert.deepEqual(target, {
        kind: 'route',
        route: { pathname: '/driver-assigned', params: { id: '77' } },
        trip: ended,
      });
    });

    it('shows the no-driver result on the search screen', async () => {
      const ended = trip('no_driver');
      const target = await resolveNotificationTarget(
        createApi({ trips: { 77: ended } }).api,
        input(),
      );
      assert.deepEqual(target, {
        kind: 'route',
        route: { pathname: '/searching', params: { id: '77' } },
        trip: ended,
      });
    });

    it('asks the server for the hinted trip, which validates ownership', async () => {
      const h = createApi({ trips: { 77: trip('no_driver') } });
      await resolveNotificationTarget(h.api, input());
      assert.deepEqual(h.lookedUp, [77]);
    });

    it('goes home, without a message, for any other trip state', async () => {
      for (const status of [
        'completed',
        'cancelled_by_passenger',
        'no_show',
        'expired',
        'pending_assignment',
      ] as const) {
        const target = await resolveNotificationTarget(
          createApi({ trips: { 77: trip(status) } }).api,
          input(),
        );
        assert.deepEqual(target, { kind: 'home', notice: null }, status);
      }
    });

    it('goes home with "trip not found" when the trip belongs to someone else (403)', async () => {
      const target = await resolveNotificationTarget(
        createApi({ trips: { 77: httpError(403) } }).api,
        input(),
      );
      assert.deepEqual(target, { kind: 'home', notice: 'trip_not_found' });
    });

    it('goes home with "trip not found" when the trip does not exist (404)', async () => {
      const target = await resolveNotificationTarget(createApi({ trips: {} }).api, input());
      assert.deepEqual(target, { kind: 'home', notice: 'trip_not_found' });
    });

    it('goes home without a message when the notification has no usable hint', async () => {
      const payloads: unknown[] = [
        undefined,
        null,
        {},
        'trip_no_driver',
        { type: 'trip_no_driver' },
        { trip_request_id: 77 },
        { type: 'something_new', trip_request_id: 77 },
        { type: 'assignment_offer', trip_request_id: 77 },
        { type: 'trip_no_driver', trip_request_id: true },
        { type: 'trip_no_driver', trip_request_id: -4 },
        { type: 'trip_no_driver', trip_request_id: 2_147_483_648 },
        { type: 'trip_no_driver', trip_request_id: '12abc' },
      ];
      for (const rawData of payloads) {
        const h = createApi({ trips: { 77: trip('no_driver') } });
        const target = await resolveNotificationTarget(h.api, input({ rawData }));
        assert.deepEqual(target, { kind: 'home', notice: null }, JSON.stringify(rawData));
        assert.deepEqual(h.lookedUp, []);
      }
    });

    it('accepts the id as text, as Android delivers it', async () => {
      const ended = trip('no_driver');
      const target = await resolveNotificationTarget(
        createApi({ trips: { 77: ended } }).api,
        input({ rawData: { type: 'trip_no_driver', trip_request_id: '77' } }),
      );
      assert.equal(target.kind, 'route');
    });

    it('shows a result only while the notification is recent enough', async () => {
      const api = createApi({ trips: { 77: trip('no_driver') } }).api;
      const atLimit = await resolveNotificationTarget(
        api,
        input({ ageMs: NOTIFICATION_STALE_AFTER_MS }),
      );
      assert.equal(atLimit.kind, 'route');
      const stale = await resolveNotificationTarget(
        api,
        input({ ageMs: NOTIFICATION_STALE_AFTER_MS + 1 }),
      );
      assert.deepEqual(stale, { kind: 'home', notice: 'trip_ended' });
    });

    it('treats an unknown or future age as recent', async () => {
      const api = createApi({ trips: { 77: trip('no_driver') } }).api;
      assert.equal((await resolveNotificationTarget(api, input({ ageMs: null }))).kind, 'route');
      assert.equal((await resolveNotificationTarget(api, input({ ageMs: -5000 }))).kind, 'route');
    });

    it('still reports "not found" for a stale notification of someone else trip', async () => {
      const target = await resolveNotificationTarget(
        createApi({ trips: { 77: httpError(403) } }).api,
        input({ ageMs: NOTIFICATION_STALE_AFTER_MS * 2 }),
      );
      assert.deepEqual(target, { kind: 'home', notice: 'trip_not_found' });
    });
  });

  describe('when the server cannot be reached', () => {
    it('reports offline when the active trip lookup has no network', async () => {
      const target = await resolveNotificationTarget(
        createApi({ active: { kind: 'network' } }).api,
        input(),
      );
      assert.deepEqual(target, { kind: 'unavailable', reason: 'offline' });
    });

    it('reports offline when the hinted trip lookup has no network', async () => {
      const target = await resolveNotificationTarget(
        createApi({ trips: { 77: { kind: 'network' } } }).api,
        input(),
      );
      assert.deepEqual(target, { kind: 'unavailable', reason: 'offline' });
    });

    it('reports an error for a server failure, never "trip cancelled"', async () => {
      const failing = await resolveNotificationTarget(
        createApi({ active: httpError(503) }).api,
        input(),
      );
      assert.deepEqual(failing, { kind: 'unavailable', reason: 'error' });
      const invalid = await resolveNotificationTarget(
        createApi({ trips: { 77: { kind: 'validation' } } }).api,
        input(),
      );
      assert.deepEqual(invalid, { kind: 'unavailable', reason: 'error' });
      const unknown = await resolveNotificationTarget(
        createApi({ active: new Error('boom') }).api,
        input(),
      );
      assert.deepEqual(unknown, { kind: 'unavailable', reason: 'error' });
    });

    it('does not mistake a 404 of the active trip lookup for a missing hinted trip', async () => {
      const target = await resolveNotificationTarget(
        createApi({ active: httpError(404) }).api,
        input(),
      );
      assert.deepEqual(target, { kind: 'unavailable', reason: 'error' });
    });
  });
});

describe('isNotOwnedOrMissing', () => {
  it('is true only for a 403 or a 404 from the server', () => {
    assert.equal(isNotOwnedOrMissing(httpError(403)), true);
    assert.equal(isNotOwnedOrMissing(httpError(404)), true);
  });

  it('is false for any other status, which must never clear the saved code', () => {
    for (const status of [400, 401, 409, 422, 429, 500, 502, 503]) {
      assert.equal(isNotOwnedOrMissing(httpError(status)), false, String(status));
    }
  });

  it('is false for network failures, validation failures and anything unknown', () => {
    assert.equal(isNotOwnedOrMissing({ kind: 'network' }), false);
    assert.equal(isNotOwnedOrMissing({ kind: 'validation' }), false);
    assert.equal(isNotOwnedOrMissing(new Error('boom')), false);
    assert.equal(isNotOwnedOrMissing(null), false);
    assert.equal(isNotOwnedOrMissing(undefined), false);
    assert.equal(isNotOwnedOrMissing('404'), false);
  });
});

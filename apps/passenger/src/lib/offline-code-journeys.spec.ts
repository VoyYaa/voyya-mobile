import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { TripRequestStatus } from '@voyyaa/shared';

import { resolveColdStart, type ColdStartInput, type ServerProbe } from './cold-start.ts';
import { savedTripRoute } from './active-trip-route.ts';
import { codeChangedAfterRestore } from './start-code-view.ts';
import { isSessionFresh } from './session-freshness.ts';
import { canRestorePickup, tripScreenMode } from './trip-screen-mode.ts';
import { toServerStartCode, usableRecord } from './start-code-record.ts';
import {
  createStartCodeRecordStore,
  type StartCodeRecordStore,
  type StartCodeStoragePort,
} from './start-code-store.ts';

const TTL = 6 * 60 * 60 * 1000;
const REFRESH = 60 * 1000;
const PICKUP_KEY = 'voyya_pickup_origin';
const T0 = 1_800_000_000_000;

function memoryPort(): StartCodeStoragePort & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: async (key) => data.get(key) ?? null,
    setItem: async (key, value) => void data.set(key, value),
    deleteItem: async (key) => void data.delete(key),
  };
}

function openStore(port: StartCodeStoragePort, clock: { now: number }): StartCodeRecordStore {
  return createStartCodeRecordStore({
    port,
    now: () => clock.now,
    companionKeys: [PICKUP_KEY],
    refreshMs: REFRESH,
    readyTimeoutMs: 200,
    installMarker: async () => null,
  });
}

function trip(overrides: Partial<TripRequestStatus> = {}): TripRequestStatus {
  return {
    trip_request_id: 41,
    status: 'assigned',
    start_code: '4821',
    start_code_state: 'active',
    ...overrides,
  } as TripRequestStatus;
}

const offline: ServerProbe = { kind: 'failed', reason: 'offline' };

function coldStart(
  store: StartCodeRecordStore,
  clock: { now: number },
  userId: number,
  server: ServerProbe,
) {
  const input: ColdStartInput = {
    session: 'authenticated',
    userId,
    server,
    record: store.getSnapshot(),
    slowSignal: false,
    now: clock.now,
    ttlMs: TTL,
  };
  return resolveColdStart(input);
}

describe('journeys of the offline start code, across the real modules', () => {
  it('HU-CS-01: the code seen with a network is shown on the next cold start without one', async () => {
    const port = memoryPort();
    const clock = { now: T0 };
    const firstRun = openStore(port, clock);
    await firstRun.ready();
    await firstRun.sync(toServerStartCode(trip()), 7);

    const secondRun = openStore(port, clock);
    await secondRun.ready();
    const { decision, discardRecord } = coldStart(secondRun, clock, 7, offline);

    assert.equal(discardRecord, false);
    assert.equal(decision.kind, 'restore');
    if (decision.kind !== 'restore') return;
    assert.equal(decision.record.start_code, '4821');
    assert.equal(decision.mode, 'offline');
    assert.deepEqual(savedTripRoute(decision.record), {
      pathname: '/driver-assigned',
      params: { id: '41', source: 'saved' },
    });
  });

  it('RN-CS-05: a fast answer from the server never shows the saved code', async () => {
    const port = memoryPort();
    const clock = { now: T0 };
    const store = openStore(port, clock);
    await store.ready();
    await store.sync(toServerStartCode(trip()), 7);

    const result = coldStart(store, clock, 7, { kind: 'answered', trip: trip() });
    assert.equal(result.decision.kind, 'server');
  });

  it('HU-CS-03: another user on the same phone sees the usual gate, and the record is discarded', async () => {
    const port = memoryPort();
    const clock = { now: T0 };
    const store = openStore(port, clock);
    await store.ready();
    await store.sync(toServerStartCode(trip()), 7);

    const next = openStore(port, clock);
    await next.ready();
    const result = coldStart(next, clock, 8, offline);
    assert.deepEqual(result, {
      decision: { kind: 'failed', reason: 'offline' },
      discardRecord: true,
    });
    await next.clear();
    assert.equal(port.data.size, 0);
  });

  it('HU-CS-03: a record older than six hours is not shown, and is discarded', async () => {
    const port = memoryPort();
    const clock = { now: T0 };
    const store = openStore(port, clock);
    await store.ready();
    await store.sync(toServerStartCode(trip()), 7);

    clock.now = T0 + TTL;
    const next = openStore(port, clock);
    await next.ready();
    const result = coldStart(next, clock, 7, offline);
    assert.deepEqual(result, {
      decision: { kind: 'failed', reason: 'offline' },
      discardRecord: true,
    });
  });

  it('HU-CS-04: a trip that ended with the app closed leaves no code for the next offline start', async () => {
    const port = memoryPort();
    const clock = { now: T0 };
    const store = openStore(port, clock);
    await store.ready();
    await store.sync(toServerStartCode(trip()), 7);
    port.data.set(PICKUP_KEY, 'pickup point');

    const online = openStore(port, clock);
    await online.ready();
    await online.reconcile(null, 7);

    const offlineStart = openStore(port, clock);
    await offlineStart.ready();
    assert.equal(coldStart(offlineStart, clock, 7, offline).decision.kind, 'failed');
    assert.equal(port.data.has(PICKUP_KEY), false);
  });

  it('HU-CS-05: a reassignment seen after the network returns shows the new code and saves it', async () => {
    const port = memoryPort();
    const clock = { now: T0 };
    const store = openStore(port, clock);
    await store.ready();
    await store.sync(toServerStartCode(trip()), 7);

    const restarted = openStore(port, clock);
    await restarted.ready();
    const shown = usableRecord(restarted.getSnapshot(), {
      tripRequestId: 41,
      userId: 7,
      now: clock.now,
      ttlMs: TTL,
    });
    assert.equal(shown?.start_code, '4821');

    const reassigned = trip({ start_code: '7305' });
    assert.equal(codeChangedAfterRestore(shown?.start_code ?? null, reassigned), true);
    clock.now = T0 + 5000;
    await restarted.reconcile(toServerStartCode(reassigned), 7);
    const snapshot = restarted.getSnapshot();
    assert.equal(snapshot.kind === 'present' && snapshot.record.start_code, '7305');
  });

  it('HU-CS-05: a reassignment that is still searching clears the record', async () => {
    const port = memoryPort();
    const clock = { now: T0 };
    const store = openStore(port, clock);
    await store.ready();
    await store.sync(toServerStartCode(trip()), 7);
    await store.reconcile(
      toServerStartCode(
        trip({
          status: 'pending_assignment',
          start_code: null,
          start_code_state: 'not_applicable',
        }),
      ),
      7,
    );
    assert.equal(port.data.size, 0);
  });

  it('a failure of the network or of the server never clears the saved record', async () => {
    const port = memoryPort();
    const clock = { now: T0 };
    const store = openStore(port, clock);
    await store.ready();
    await store.sync(toServerStartCode(trip()), 7);

    for (const server of [
      offline,
      { kind: 'failed', reason: 'error' },
      { kind: 'pending' },
    ] as const) {
      const next = openStore(port, clock);
      await next.ready();
      const result = coldStart(next, clock, 7, server);
      assert.equal(result.discardRecord, false, server.kind);
    }
    assert.equal(port.data.size, 1);
  });

  it('CS-01: user B never sees, and never saves, the trip of user A that was left in the cache', async () => {
    const port = memoryPort();
    const clock = { now: T0 };
    const store = openStore(port, clock);
    await store.ready();

    const sessionOfB = T0 + 1000;
    const cachedBeforeB = T0 + 500;
    assert.equal(isSessionFresh(cachedBeforeB, sessionOfB), false);

    const mode = tripScreenMode({
      hasFreshData: isSessionFresh(cachedBeforeB, sessionOfB),
      isError: true,
      notOwnedOrMissing: true,
      offline: false,
      retrying: false,
      lastAttemptFailed: true,
      restoredRecord: null,
      enteredFromSaved: true,
    });
    assert.deepEqual(mode, { kind: 'not_found' });
    assert.equal(
      canRestorePickup({ restoredRecord: null, tripRequestId: 41, hasFreshData: false }),
      false,
    );
    assert.equal(port.data.size, 0);
  });

  it('writes nothing of the driver, ever (RN-CS-02)', async () => {
    const port = memoryPort();
    const store = openStore(port, { now: T0 });
    await store.ready();
    const full = trip({
      driver: {
        name: 'Ana Pérez',
        phone: '3001234567',
        plate: 'ABC101',
        vehicle: 'Chevrolet Spark',
        company: { company_id: 3, display_name: 'Cootrayal' },
      },
      fare: { total: 8000 },
    } as Partial<TripRequestStatus>);
    await store.sync(toServerStartCode(full), 7);
    const everything = [...port.data.values()].join('|');
    assert.doesNotMatch(everything, /Ana|Pérez|3001234567|ABC101|Spark|Cootrayal|fare|driver/);
    assert.equal(JSON.parse(port.data.get('voyya_start_code') ?? '{}').start_code, '4821');
  });
});

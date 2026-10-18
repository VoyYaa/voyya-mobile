import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  INSTALL_MARKER_KEY,
  createStartCodeRecordStore,
  type StartCodeRecordStore,
  type StartCodeStoragePort,
} from './start-code-store.ts';
import {
  START_CODE_KEY,
  START_CODE_RECORD_VERSION,
  serializeStartCodeRecord,
  type ServerStartCode,
  type StartCodeRecord,
} from './start-code-record.ts';

const PICKUP_KEY = 'voyya_pickup_origin';
const NOW = 1_800_000_000_000;
const USER = 7;
const REFRESH = 60_000;

interface Operation {
  kind: 'get' | 'set' | 'delete';
  key: string;
  thisDeviceOnly?: boolean;
}

interface MemoryPort extends StartCodeStoragePort {
  data: Map<string, string>;
  operations: Operation[];
  failDelete: Set<string>;
  failSet: boolean;
  failGet: boolean;
  hangDelete: boolean;
}

function memoryPort(): MemoryPort {
  const port: MemoryPort = {
    data: new Map<string, string>(),
    operations: [],
    failDelete: new Set<string>(),
    failSet: false,
    failGet: false,
    hangDelete: false,
    getItem: async (key) => {
      port.operations.push({ kind: 'get', key });
      if (port.failGet) throw new Error('locked');
      return port.data.get(key) ?? null;
    },
    setItem: async (key, value, options) => {
      port.operations.push({ kind: 'set', key, thisDeviceOnly: options?.thisDeviceOnly === true });
      if (port.failSet) throw new Error('locked');
      port.data.set(key, value);
    },
    deleteItem: async (key) => {
      port.operations.push({ kind: 'delete', key });
      if (port.hangDelete) return new Promise<void>(() => undefined);
      if (port.failDelete.has(key)) throw new Error('locked');
      port.data.delete(key);
    },
  };
  return port;
}

function record(overrides: Partial<StartCodeRecord> = {}): StartCodeRecord {
  return {
    version: START_CODE_RECORD_VERSION,
    trip_request_id: 41,
    user_id: USER,
    start_code: '4821',
    saved_at: NOW - 1000,
    ...overrides,
  };
}

function active(overrides: Partial<ServerStartCode> = {}): ServerStartCode {
  return { trip_request_id: 41, start_code: '4821', start_code_state: 'active', ...overrides };
}

interface Harness {
  store: StartCodeRecordStore;
  port: MemoryPort;
  clock: { now: number };
}

function build(
  options: {
    port?: MemoryPort;
    installMarker?: () => Promise<string | null>;
    readyTimeoutMs?: number;
    clock?: { now: number };
  } = {},
): Harness {
  const port = options.port ?? memoryPort();
  const clock = options.clock ?? { now: NOW };
  const store = createStartCodeRecordStore({
    port,
    now: () => clock.now,
    companionKeys: [PICKUP_KEY],
    refreshMs: REFRESH,
    readyTimeoutMs: options.readyTimeoutMs ?? 500,
    installMarker: options.installMarker ?? (async () => null),
  });
  return { store, port, clock };
}

function seed(port: MemoryPort, value: StartCodeRecord = record()): void {
  port.data.set(START_CODE_KEY, serializeStartCodeRecord(value));
}

function stored(port: MemoryPort): unknown {
  const raw = port.data.get(START_CODE_KEY);
  return raw === undefined ? null : JSON.parse(raw);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('createStartCodeRecordStore: loading', () => {
  it('starts loading and shows the record found on disk once ready', async () => {
    const { store, port } = build();
    seed(port);
    assert.deepEqual(store.getSnapshot(), { kind: 'loading' });
    await store.ready();
    assert.deepEqual(store.getSnapshot(), { kind: 'present', record: record() });
  });

  it('is absent when there is nothing on disk', async () => {
    const { store } = build();
    await store.ready();
    assert.deepEqual(store.getSnapshot(), { kind: 'absent' });
  });

  it('keeps an unreadable value as invalid, so something can discard it, and never throws', async () => {
    const { store, port } = build();
    port.data.set(START_CODE_KEY, 'not json');
    await store.ready();
    assert.deepEqual(store.getSnapshot(), { kind: 'invalid' });
  });

  it('treats a read that fails, for example a locked keychain, as absent', async () => {
    const { store, port } = build();
    seed(port);
    port.failGet = true;
    await store.ready();
    assert.deepEqual(store.getSnapshot(), { kind: 'absent' });
  });

  it('does not try to delete anything after a failed read', async () => {
    const { store, port } = build();
    port.failGet = true;
    await store.ready();
    assert.equal(port.operations.filter((op) => op.kind === 'delete').length, 0);
  });

  it('does the work once, however many times it is asked to be ready', async () => {
    const { store, port } = build();
    seed(port);
    await Promise.all([store.ready(), store.ready(), store.ready()]);
    assert.equal(port.operations.filter((op) => op.kind === 'get').length, 1);
  });

  it('keeps the snapshot reference stable while nothing changes', async () => {
    const { store } = build();
    await store.ready();
    assert.equal(store.getSnapshot(), store.getSnapshot());
  });
});

describe('createStartCodeRecordStore: writing', () => {
  it('writes only on this device, under the code key (U-04)', async () => {
    const { store, port } = build();
    await store.ready();
    await store.sync(active(), USER);
    const write = port.operations.find((op) => op.kind === 'set');
    assert.equal(write?.key, START_CODE_KEY);
    assert.equal(write?.thisDeviceOnly, true);
    assert.deepEqual(stored(port), record({ saved_at: NOW }));
  });

  it('writes exactly the five properties of the record, nothing of the response (U-10)', async () => {
    const { store, port } = build();
    await store.ready();
    const full = {
      ...active(),
      driver: { name: 'Ana', phone: '3001234567', plate: 'ABC101' },
      fare: { total: 8000 },
    } as ServerStartCode;
    await store.sync(full, USER);
    const raw = port.data.get(START_CODE_KEY) ?? '';
    assert.deepEqual(Object.keys(JSON.parse(raw) as object).sort(), [
      'saved_at',
      'start_code',
      'trip_request_id',
      'user_id',
      'version',
    ]);
    assert.doesNotMatch(raw, /Ana|3001234567|ABC101|fare|driver/);
  });

  it('refreshes the time at most once a minute when the code does not change', async () => {
    const { store, port, clock } = build();
    await store.ready();
    await store.sync(active(), USER);
    const writes = (): number => port.operations.filter((op) => op.kind === 'set').length;
    assert.equal(writes(), 1);

    clock.now = NOW + REFRESH - 1000;
    await store.sync(active(), USER);
    assert.equal(writes(), 1);

    clock.now = NOW + REFRESH;
    await store.sync(active(), USER);
    assert.equal(writes(), 2);
    assert.deepEqual(stored(port), record({ saved_at: NOW + REFRESH }));
  });

  it('replaces the code at once when the same trip gets a new one', async () => {
    const { store, port } = build();
    await store.ready();
    await store.sync(active(), USER);
    await store.sync(active({ start_code: '7305' }), USER);
    assert.deepEqual(stored(port), record({ start_code: '7305', saved_at: NOW }));
  });

  it('keeps the mirror with the new value when the write fails, so the screen goes on (HU-CS-03)', async () => {
    const { store, port } = build();
    await store.ready();
    port.failSet = true;
    await store.sync(active(), USER);
    assert.deepEqual(store.getSnapshot(), { kind: 'present', record: record({ saved_at: NOW }) });
    assert.equal(port.data.has(START_CODE_KEY), false);
  });

  it('never creates a record from a reconciliation, but does replace one that exists', async () => {
    const { store, port } = build();
    await store.ready();
    await store.reconcile(active(), USER);
    assert.equal(port.operations.filter((op) => op.kind === 'set').length, 0);
    assert.deepEqual(store.getSnapshot(), { kind: 'absent' });

    await store.sync(active(), USER);
    await store.reconcile(active({ start_code: '1111' }), USER);
    assert.deepEqual(stored(port), record({ start_code: '1111', saved_at: NOW }));
  });
});

describe('createStartCodeRecordStore: clearing', () => {
  it('deletes the code and the pickup point together (RN-CS-06)', async () => {
    const { store, port } = build();
    seed(port);
    port.data.set(PICKUP_KEY, '{"trip_request_id":41}');
    await store.ready();
    await store.clear();
    assert.equal(port.data.has(START_CODE_KEY), false);
    assert.equal(port.data.has(PICKUP_KEY), false);
    assert.deepEqual(store.getSnapshot(), { kind: 'absent' });
  });

  it('clears when the server has no active trip at all', async () => {
    const { store, port } = build();
    seed(port);
    port.data.set(PICKUP_KEY, 'point');
    await store.ready();
    await store.reconcile(null, USER);
    assert.equal(port.data.has(START_CODE_KEY), false);
    assert.equal(port.data.has(PICKUP_KEY), false);
    assert.deepEqual(store.getSnapshot(), { kind: 'absent' });
  });

  it('clears in every state other than active, with or without the screen open', async () => {
    for (const method of ['sync', 'reconcile'] as const) {
      for (const state of ['blocked', 'not_required', 'not_applicable'] as const) {
        const { store, port } = build();
        seed(port);
        port.data.set(PICKUP_KEY, 'point');
        await store.ready();
        await store[method](active({ start_code: null, start_code_state: state }), USER);
        assert.equal(port.data.has(START_CODE_KEY), false, `${method} ${state}`);
        assert.equal(port.data.has(PICKUP_KEY), false, `${method} ${state}`);
      }
    }
  });

  it('clears the record of another trip when reconciling', async () => {
    const { store, port } = build();
    seed(port, record({ trip_request_id: 40 }));
    await store.ready();
    await store.reconcile(active(), USER);
    assert.equal(port.data.has(START_CODE_KEY), false);
  });

  it('notifies the mirror before it touches the disk (U-04)', async () => {
    const { store, port } = build();
    seed(port);
    await store.ready();
    const diskWhenNotified: boolean[] = [];
    store.subscribe(() => diskWhenNotified.push(port.data.has(START_CODE_KEY)));
    const done = store.clear();
    assert.deepEqual(store.getSnapshot(), { kind: 'absent' });
    assert.deepEqual(diskWhenNotified, [true]);
    await done;
    assert.equal(port.data.has(START_CODE_KEY), false);
  });

  it('stops notifying a listener once it unsubscribes', async () => {
    const { store, port } = build();
    seed(port);
    await store.ready();
    let calls = 0;
    const off = store.subscribe(() => (calls += 1));
    off();
    await store.clear();
    assert.equal(calls, 0);
  });

  it('ends on disk in the order the decisions were taken, when a clear and a sync cross (U-04)', async () => {
    const first = build();
    await first.store.ready();
    const a = first.store.sync(active(), USER);
    const b = first.store.clear();
    await Promise.all([a, b]);
    assert.equal(first.port.data.has(START_CODE_KEY), false);
    assert.deepEqual(first.store.getSnapshot(), { kind: 'absent' });

    const second = build();
    await second.store.ready();
    const c = second.store.clear();
    const d = second.store.sync(active(), USER);
    await Promise.all([c, d]);
    assert.deepEqual(stored(second.port), record({ saved_at: NOW }));
    assert.equal(second.store.getSnapshot().kind, 'present');
  });

  it('leaves the mirror absent but the disk untouched when the delete fails, and says so (U-12)', async () => {
    const { store, port } = build();
    seed(port);
    await store.ready();
    port.failDelete.add(START_CODE_KEY);
    await store.clear();
    assert.deepEqual(store.getSnapshot(), { kind: 'absent' });
    assert.equal(port.data.has(START_CODE_KEY), true);
  });

  it('deletes an invalid value, and its companion, on the next sync or reconcile', async () => {
    for (const method of ['sync', 'reconcile'] as const) {
      const { store, port } = build();
      port.data.set(START_CODE_KEY, 'garbage');
      port.data.set(PICKUP_KEY, 'point');
      await store.ready();
      assert.equal(store.getSnapshot().kind, 'invalid');
      await store[method](active({ start_code: null, start_code_state: 'not_applicable' }), USER);
      assert.equal(port.data.has(START_CODE_KEY), false, method);
      assert.equal(port.data.has(PICKUP_KEY), false, method);
      assert.equal(store.getSnapshot().kind, 'absent', method);
    }
  });

  it('deletes an invalid value before writing the new record', async () => {
    const { store, port } = build();
    port.data.set(START_CODE_KEY, 'garbage');
    port.data.set(PICKUP_KEY, 'point');
    await store.ready();
    await store.sync(active(), USER);
    assert.deepEqual(stored(port), record({ saved_at: NOW }));
    assert.equal(port.data.has(PICKUP_KEY), false);
  });
});

describe('createStartCodeRecordStore: before it is ready', () => {
  it('waits for the load before deciding, so a response never meets an unknown disk', async () => {
    const { store, port } = build();
    seed(port, record({ trip_request_id: 40 }));
    await store.reconcile(active(), USER);
    assert.equal(port.data.has(START_CODE_KEY), false);
  });

  it('drops a decision that a later clear has overtaken', async () => {
    const { store, port } = build();
    seed(port);
    const pending = store.sync(active({ start_code: '9999' }), USER);
    const cleared = store.clear();
    await Promise.all([pending, cleared]);
    assert.equal(port.data.has(START_CODE_KEY), false);
    assert.deepEqual(store.getSnapshot(), { kind: 'absent' });
  });

  it('does not apply a load that finishes after the passenger cleared in the meantime', async () => {
    const { store, port } = build({ readyTimeoutMs: 5 });
    seed(port);
    const slow = port.getItem;
    port.getItem = async (key) => {
      await delay(30);
      return slow(key);
    };
    await store.ready();
    await store.clear();
    await delay(60);
    assert.deepEqual(store.getSnapshot(), { kind: 'absent' });
  });
});

describe('createStartCodeRecordStore: fresh install (U-05, U-13)', () => {
  it('deletes the code and its companions before it writes the install marker', async () => {
    const { store, port } = build({ installMarker: async () => 'install-A' });
    seed(port);
    port.data.set(PICKUP_KEY, 'point');
    await store.ready();

    const deletes = port.operations.filter((op) => op.kind === 'delete').map((op) => op.key);
    assert.deepEqual(deletes.sort(), [PICKUP_KEY, START_CODE_KEY].sort());
    const markerWrite = port.operations.findIndex(
      (op) => op.kind === 'set' && op.key === INSTALL_MARKER_KEY,
    );
    const lastDelete = port.operations.map((op) => op.kind).lastIndexOf('delete');
    assert.ok(markerWrite > lastDelete, 'the marker is written after every delete');
    assert.equal(port.data.get(INSTALL_MARKER_KEY), 'install-A');
    assert.equal(port.operations[markerWrite]?.thisDeviceOnly, true);
  });

  it('reads the record only after the delete, so a record of a previous install is never shown', async () => {
    const { store, port } = build({ installMarker: async () => 'install-A' });
    seed(port);
    await store.ready();
    assert.deepEqual(store.getSnapshot(), { kind: 'absent' });
    const reads = port.operations.filter((op) => op.kind === 'get' && op.key === START_CODE_KEY);
    const firstRead = port.operations.indexOf(reads[0] as Operation);
    const lastDelete = port.operations.map((op) => op.kind).lastIndexOf('delete');
    assert.ok(firstRead > lastDelete);
  });

  it('deletes nothing when the install marker is the one it already knows', async () => {
    const { store, port } = build({ installMarker: async () => 'install-A' });
    port.data.set(INSTALL_MARKER_KEY, 'install-A');
    seed(port);
    await store.ready();
    assert.equal(port.operations.filter((op) => op.kind === 'delete').length, 0);
    assert.equal(store.getSnapshot().kind, 'present');
  });

  it('wipes again when the marker changes, and keeps a record written in between', async () => {
    const harness = build({ installMarker: async () => 'install-A' });
    seed(harness.port);
    await harness.store.ready();
    await harness.store.sync(active(), USER);
    assert.equal(harness.store.getSnapshot().kind, 'present');

    const next = build({ port: harness.port, installMarker: async () => 'install-B' });
    await next.store.ready();
    assert.deepEqual(next.store.getSnapshot(), { kind: 'absent' });
    assert.equal(harness.port.data.get(INSTALL_MARKER_KEY), 'install-B');
  });

  it('does not wipe when the platform has no install marker, as on the web', async () => {
    const { store, port } = build({ installMarker: async () => null });
    seed(port);
    await store.ready();
    assert.equal(port.operations.filter((op) => op.kind === 'delete').length, 0);
    assert.equal(store.getSnapshot().kind, 'present');
  });

  it('does not wipe when the install time cannot be read', async () => {
    const { store, port } = build({
      installMarker: async () => {
        throw new Error('unavailable');
      },
    });
    seed(port);
    await store.ready();
    assert.equal(port.operations.filter((op) => op.kind === 'delete').length, 0);
    assert.equal(store.getSnapshot().kind, 'present');
  });

  it('does not write the marker if the delete of the code fails, and tries again next time (U-13)', async () => {
    const port = memoryPort();
    seed(port);
    port.data.set(PICKUP_KEY, 'point');
    port.failDelete.add(START_CODE_KEY);

    const first = build({ port, installMarker: async () => 'install-A' });
    await first.store.ready();
    assert.equal(port.data.has(INSTALL_MARKER_KEY), false);
    assert.deepEqual(first.store.getSnapshot(), { kind: 'absent' });
    assert.equal(port.data.has(PICKUP_KEY), false);

    port.failDelete.clear();
    const second = build({ port, installMarker: async () => 'install-A' });
    await second.store.ready();
    assert.equal(port.data.has(START_CODE_KEY), false);
    assert.equal(port.data.get(INSTALL_MARKER_KEY), 'install-A');
  });

  it('does not write the marker if the delete of the pickup point fails, and tries again next time (U-13)', async () => {
    const port = memoryPort();
    seed(port);
    port.data.set(PICKUP_KEY, 'point');
    port.failDelete.add(PICKUP_KEY);

    const first = build({ port, installMarker: async () => 'install-A' });
    await first.store.ready();
    assert.equal(port.data.has(INSTALL_MARKER_KEY), false);
    assert.equal(port.data.has(START_CODE_KEY), false);

    port.failDelete.clear();
    const second = build({ port, installMarker: async () => 'install-A' });
    await second.store.ready();
    assert.equal(port.data.has(PICKUP_KEY), false);
    assert.equal(port.data.get(INSTALL_MARKER_KEY), 'install-A');
  });

  it('does not show a record of the previous install when the wipe failed', async () => {
    const port = memoryPort();
    seed(port);
    port.failDelete.add(START_CODE_KEY);
    const { store } = build({ port, installMarker: async () => 'install-A' });
    await store.ready();
    assert.deepEqual(store.getSnapshot(), { kind: 'absent' });
  });

  it('bounds the whole chain: a delete that hangs leaves the mirror absent and loads nothing (U-05)', async () => {
    const port = memoryPort();
    seed(port);
    port.hangDelete = true;
    const { store } = build({ port, installMarker: async () => 'install-A', readyTimeoutMs: 20 });
    await store.ready();
    assert.deepEqual(store.getSnapshot(), { kind: 'absent' });
    await delay(30);
    assert.equal(
      port.operations.filter((op) => op.kind === 'get' && op.key === START_CODE_KEY).length,
      0,
    );
    assert.deepEqual(store.getSnapshot(), { kind: 'absent' });
  });

  it('applies a slow load that finishes after the deadline, once the wipe is done (U-05)', async () => {
    const port = memoryPort();
    seed(port);
    port.data.set(INSTALL_MARKER_KEY, 'install-A');
    const { store } = build({
      port,
      readyTimeoutMs: 10,
      installMarker: async () => {
        await delay(40);
        return 'install-A';
      },
    });
    await store.ready();
    assert.deepEqual(store.getSnapshot(), { kind: 'absent' });
    await delay(80);
    assert.deepEqual(store.getSnapshot(), { kind: 'present', record: record() });
  });

  it('tells the listeners when a late load lands, so the startup decision can be taken again', async () => {
    const port = memoryPort();
    seed(port);
    const { store } = build({
      port,
      readyTimeoutMs: 10,
      installMarker: async () => {
        await delay(40);
        return null;
      },
    });
    let notified = 0;
    store.subscribe(() => (notified += 1));
    await store.ready();
    const afterDeadline = notified;
    await delay(80);
    assert.ok(notified > afterDeadline);
  });
});

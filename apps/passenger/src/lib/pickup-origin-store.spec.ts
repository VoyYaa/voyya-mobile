import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  PICKUP_ORIGIN_KEY,
  createPickupOriginStore,
  type PickupOriginStoragePort,
} from './pickup-origin-store.ts';

const ORIGIN = { lat: 6.9642, lng: -75.419, address: 'Parque principal' };

function memoryPort(): PickupOriginStoragePort & {
  data: Map<string, string>;
  deviceOnly: boolean[];
} {
  const data = new Map<string, string>();
  const deviceOnly: boolean[] = [];
  return {
    data,
    deviceOnly,
    getItem: async (key) => data.get(key) ?? null,
    setItem: async (key, value, options) => {
      deviceOnly.push(options?.thisDeviceOnly === true);
      data.set(key, value);
    },
    deleteItem: async (key) => {
      data.delete(key);
    },
  };
}

describe('pickup origin store', () => {
  it('saves the pickup tied to its trip and only on this device', async () => {
    const port = memoryPort();
    const store = createPickupOriginStore(port);
    await store.save(41, ORIGIN);
    assert.deepEqual(await store.read(41), ORIGIN);
    assert.deepEqual(port.deviceOnly, [true]);
  });

  it('never returns the pickup of another trip', async () => {
    const store = createPickupOriginStore(memoryPort());
    await store.save(41, ORIGIN);
    assert.equal(await store.read(42), null);
  });

  it('ignores corrupted or out-of-range values', async () => {
    const port = memoryPort();
    const store = createPickupOriginStore(port);
    port.data.set(PICKUP_ORIGIN_KEY, '{not json');
    assert.equal(await store.read(41), null);
    port.data.set(
      PICKUP_ORIGIN_KEY,
      JSON.stringify({ trip_request_id: 41, origin: { lat: 80, lng: 0, address: 'x' } }),
    );
    assert.equal(await store.read(41), null);
  });

  it('clears what it saved and survives a failing storage', async () => {
    const port = memoryPort();
    const store = createPickupOriginStore(port);
    await store.save(41, ORIGIN);
    await store.clear();
    assert.equal(await store.read(41), null);
    const broken = createPickupOriginStore({
      getItem: () => Promise.reject(new Error('x')),
      setItem: () => Promise.reject(new Error('x')),
      deleteItem: () => Promise.reject(new Error('x')),
    });
    assert.equal(await broken.read(1), null);
    await broken.save(1, ORIGIN);
    await broken.clear();
  });
});

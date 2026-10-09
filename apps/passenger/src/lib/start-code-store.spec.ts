import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  INSTALL_MARKER_KEY,
  START_CODE_KEY,
  createStartCodeStore,
  type StartCodeStoragePort,
} from './start-code-store.ts';

interface Write {
  key: string;
  value: string;
  thisDeviceOnly: boolean;
}

function memoryPort(): StartCodeStoragePort & {
  data: Map<string, string>;
  writes: Write[];
} {
  const data = new Map<string, string>();
  const writes: Write[] = [];
  return {
    data,
    writes,
    getItem: async (key) => data.get(key) ?? null,
    setItem: async (key, value, options) => {
      writes.push({ key, value, thisDeviceOnly: options?.thisDeviceOnly === true });
      data.set(key, value);
    },
    deleteItem: async (key) => {
      data.delete(key);
    },
  };
}

describe('start code store', () => {
  it('saves the code tied to its trip and only on this device', async () => {
    const port = memoryPort();
    const store = createStartCodeStore(port);
    await store.save(41, '0042');
    assert.equal(await store.read(41), '0042');
    assert.equal(port.writes[0]?.key, START_CODE_KEY);
    assert.equal(port.writes[0]?.thisDeviceOnly, true);
  });

  it('never returns the code of another trip', async () => {
    const store = createStartCodeStore(memoryPort());
    await store.save(41, '4821');
    assert.equal(await store.read(42), null);
  });

  it('refuses to store anything that is not four digits', async () => {
    const port = memoryPort();
    const store = createStartCodeStore(port);
    for (const code of ['12a4', '12345', '', '123']) await store.save(1, code);
    assert.equal(port.writes.length, 0);
  });

  it('discards a corrupted value instead of showing it', async () => {
    const port = memoryPort();
    const store = createStartCodeStore(port);
    for (const raw of [
      'not json',
      '{"trip_request_id":"7","start_code":"1234"}',
      '{"trip_request_id":7,"start_code":"12"}',
      'null',
    ]) {
      port.data.set(START_CODE_KEY, raw);
      assert.equal(await store.read(7), null, raw);
    }
  });

  it('rewrites the saved value with every active response', async () => {
    const store = createStartCodeStore(memoryPort());
    await store.sync(41, { start_code: '1111', start_code_state: 'active' });
    await store.sync(41, { start_code: '2222', start_code_state: 'active' });
    assert.equal(await store.read(41), '2222');
  });

  it('clears the code in any other state', async () => {
    for (const state of ['blocked', 'not_required', 'not_applicable']) {
      const store = createStartCodeStore(memoryPort());
      await store.save(41, '4821');
      await store.sync(41, { start_code: null, start_code_state: state });
      assert.equal(await store.read(41), null, state);
    }
  });

  it('clears the code on logout', async () => {
    const port = memoryPort();
    const store = createStartCodeStore(port);
    await store.save(41, '4821');
    await store.clear();
    assert.equal(port.data.has(START_CODE_KEY), false);
  });

  it('wipes a code left in the Keychain by a previous install, once', async () => {
    const port = memoryPort();
    const store = createStartCodeStore(port);
    port.data.set(START_CODE_KEY, JSON.stringify({ trip_request_id: 3, start_code: '9999' }));

    assert.equal(await store.wipeOnFreshInstall('install-A'), true);
    assert.equal(port.data.has(START_CODE_KEY), false);
    assert.equal(port.data.get(INSTALL_MARKER_KEY), 'install-A');

    await store.save(4, '1234');
    assert.equal(await store.wipeOnFreshInstall('install-A'), false);
    assert.equal(await store.read(4), '1234');

    assert.equal(await store.wipeOnFreshInstall('install-B'), true);
    assert.equal(await store.read(4), null);
  });

  it('survives a storage that fails', async () => {
    const store = createStartCodeStore({
      getItem: async () => {
        throw new Error('locked');
      },
      setItem: async () => {
        throw new Error('locked');
      },
      deleteItem: async () => {
        throw new Error('locked');
      },
    });
    assert.equal(await store.read(1), null);
    await store.save(1, '1234');
    await store.clear();
    assert.equal(await store.wipeOnFreshInstall('x'), true);
  });
});

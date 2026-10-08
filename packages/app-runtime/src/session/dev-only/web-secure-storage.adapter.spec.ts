import { afterEach, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { webDevOnlySecureStoragePort } from './web-secure-storage.adapter.ts';

function createMemoryStorage(): {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
} {
  const entries = new Map<string, string>();
  return {
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => {
      entries.set(key, value);
    },
    removeItem: (key) => {
      entries.delete(key);
    },
  };
}

describe('webDevOnlySecureStoragePort', () => {
  const target = globalThis as { sessionStorage?: unknown };

  beforeEach(() => {
    target.sessionStorage = createMemoryStorage();
  });

  afterEach(() => {
    delete target.sessionStorage;
  });

  it('round-trips a value', async () => {
    await webDevOnlySecureStoragePort.setItem('token', 'abc');
    assert.equal(await webDevOnlySecureStoragePort.getItem('token'), 'abc');
  });

  it('returns null once the key is deleted', async () => {
    await webDevOnlySecureStoragePort.setItem('token', 'abc');
    await webDevOnlySecureStoragePort.deleteItem('token');
    assert.equal(await webDevOnlySecureStoragePort.getItem('token'), null);
  });

  it('degrades to null when sessionStorage does not exist', async () => {
    delete target.sessionStorage;
    await webDevOnlySecureStoragePort.setItem('token', 'abc');
    assert.equal(await webDevOnlySecureStoragePort.getItem('token'), null);
  });
});

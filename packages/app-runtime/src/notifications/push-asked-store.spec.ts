import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { SecureStoragePort } from '../session/secure-storage-port.ts';
import { PUSH_ASKED_KEY, createPushAskedStore } from './push-asked-store.ts';

function memoryPort(): { port: SecureStoragePort; entries: Map<string, string> } {
  const entries = new Map<string, string>();
  return {
    entries,
    port: {
      getItem: async (key) => entries.get(key) ?? null,
      setItem: async (key, value) => {
        entries.set(key, value);
      },
      deleteItem: async (key) => {
        entries.delete(key);
      },
    },
  };
}

describe('pushAskedStore', () => {
  it('has not asked on a fresh install', async () => {
    assert.equal(await createPushAskedStore(() => memoryPort().port).read(), false);
  });

  it('remembers that the system dialog was asked for', async () => {
    const { port, entries } = memoryPort();
    const store = createPushAskedStore(() => port);
    await store.mark();
    assert.equal(entries.has(PUSH_ASKED_KEY), true);
    assert.equal(await createPushAskedStore(() => port).read(), true);
  });

  it('reads as not asked when the storage fails', async () => {
    const store = createPushAskedStore(() => ({
      getItem: async () => {
        throw new Error('keystore');
      },
      setItem: async () => undefined,
      deleteItem: async () => undefined,
    }));
    assert.equal(await store.read(), false);
  });
});

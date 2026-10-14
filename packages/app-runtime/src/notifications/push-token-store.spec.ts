import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type {
  SecureStoragePort,
  SecureStorageWriteOptions,
} from '../session/secure-storage-port.ts';
import { PUSH_TOKEN_KEY, createPushTokenStore } from './push-token-store.ts';

const TOKEN = 'ExponentPushToken[abcdefghijklmnopqrstuv]';

function memoryPort(): {
  port: SecureStoragePort;
  entries: Map<string, string>;
  writes: Array<{ key: string; options: SecureStorageWriteOptions | undefined }>;
} {
  const entries = new Map<string, string>();
  const writes: Array<{ key: string; options: SecureStorageWriteOptions | undefined }> = [];
  return {
    entries,
    writes,
    port: {
      getItem: async (key) => entries.get(key) ?? null,
      setItem: async (key, value, options) => {
        writes.push({ key, options });
        entries.set(key, value);
      },
      deleteItem: async (key) => {
        entries.delete(key);
      },
    },
  };
}

describe('pushTokenStore', () => {
  it('keeps the token under its own key, on this device only', async () => {
    const { port, entries, writes } = memoryPort();
    const store = createPushTokenStore(() => port);
    await store.remember(TOKEN);
    assert.equal(entries.get(PUSH_TOKEN_KEY), TOKEN);
    assert.deepEqual(writes, [{ key: PUSH_TOKEN_KEY, options: { thisDeviceOnly: true } }]);
    assert.equal(await store.read(), TOKEN);
  });

  it('overwrites the remembered token on every registration, because FCM rotates it', async () => {
    const { port } = memoryPort();
    const store = createPushTokenStore(() => port);
    await store.remember(TOKEN);
    await store.remember('ExponentPushToken[zzzzzzzzzzzzzzzzzzzzzz]');
    assert.equal(await store.read(), 'ExponentPushToken[zzzzzzzzzzzzzzzzzzzzzz]');
  });

  it('forgets the token', async () => {
    const { port, entries } = memoryPort();
    const store = createPushTokenStore(() => port);
    await store.remember(TOKEN);
    await store.forget();
    assert.equal(entries.has(PUSH_TOKEN_KEY), false);
    assert.equal(await store.read(), null);
  });

  it('never returns a stored value that is not a valid Expo token', async () => {
    const { port, entries } = memoryPort();
    entries.set(PUSH_TOKEN_KEY, 'not-a-token');
    const store = createPushTokenStore(() => port);
    assert.equal(await store.read(), null);
  });

  it('reads as empty when the secure storage fails', async () => {
    const store = createPushTokenStore(() => ({
      getItem: async () => {
        throw new Error('keystore unavailable');
      },
      setItem: async () => undefined,
      deleteItem: async () => undefined,
    }));
    assert.equal(await store.read(), null);
  });
});

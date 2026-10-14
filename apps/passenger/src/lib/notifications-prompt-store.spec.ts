import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  NOTIFICATIONS_PROMPT_KEY,
  createNotificationsPromptStore,
  type NotificationsPromptStoragePort,
} from './notifications-prompt-store.ts';

function memoryPort(initial?: string): {
  port: NotificationsPromptStoragePort;
  entries: Map<string, string>;
} {
  const entries = new Map<string, string>();
  if (initial !== undefined) entries.set(NOTIFICATIONS_PROMPT_KEY, initial);
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

describe('notifications prompt store', () => {
  it('starts with no declines and nothing offered', async () => {
    const store = createNotificationsPromptStore(memoryPort().port);
    assert.deepEqual(await store.read(), { declineCount: 0, offeredTripId: null });
  });

  it('remembers which trip the sheet was offered for', async () => {
    const store = createNotificationsPromptStore(memoryPort().port);
    await store.recordOffered(77);
    assert.deepEqual(await store.read(), { declineCount: 0, offeredTripId: 77 });
  });

  it('counts every "Ahora no" and keeps the offered trip', async () => {
    const store = createNotificationsPromptStore(memoryPort().port);
    await store.recordOffered(77);
    await store.recordDeclined();
    await store.recordDeclined();
    assert.deepEqual(await store.read(), { declineCount: 2, offeredTripId: 77 });
  });

  it('keeps the decline count when it is offered for another trip', async () => {
    const store = createNotificationsPromptStore(memoryPort().port);
    await store.recordDeclined();
    await store.recordOffered(80);
    assert.deepEqual(await store.read(), { declineCount: 1, offeredTripId: 80 });
  });

  it('survives a new store over the same storage, as after restarting the app', async () => {
    const { port } = memoryPort();
    await createNotificationsPromptStore(port).recordDeclined();
    assert.equal((await createNotificationsPromptStore(port).read()).declineCount, 1);
  });

  it('reads as empty when the stored value is damaged', async () => {
    for (const raw of [
      'not json',
      '[]',
      'null',
      '{"declineCount":"2","offeredTripId":1}',
      '{"declineCount":-1,"offeredTripId":1}',
      '{"declineCount":1.5,"offeredTripId":1}',
      '{"declineCount":1,"offeredTripId":"x"}',
    ]) {
      const store = createNotificationsPromptStore(memoryPort(raw).port);
      assert.deepEqual(await store.read(), { declineCount: 0, offeredTripId: null }, raw);
    }
  });

  it('never throws when the storage fails', async () => {
    const failing: NotificationsPromptStoragePort = {
      getItem: async () => {
        throw new Error('keystore');
      },
      setItem: async () => {
        throw new Error('keystore');
      },
      deleteItem: async () => {
        throw new Error('keystore');
      },
    };
    const store = createNotificationsPromptStore(failing);
    assert.deepEqual(await store.read(), { declineCount: 0, offeredTripId: null });
    await store.recordOffered(1);
    await store.recordDeclined();
    await store.clear();
  });

  it('clears everything', async () => {
    const { port, entries } = memoryPort();
    const store = createNotificationsPromptStore(port);
    await store.recordDeclined();
    await store.clear();
    assert.equal(entries.has(NOTIFICATIONS_PROMPT_KEY), false);
  });
});

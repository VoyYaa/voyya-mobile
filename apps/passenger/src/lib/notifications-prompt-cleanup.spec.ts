import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { clearPromptStateOnSessionEnd } from './notifications-prompt-cleanup.ts';
import {
  NOTIFICATIONS_PROMPT_KEY,
  createNotificationsPromptStore,
  type NotificationsPromptStoragePort,
} from './notifications-prompt-store.ts';

function memoryPort(): { port: NotificationsPromptStoragePort; entries: Map<string, string> } {
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

describe('clearPromptStateOnSessionEnd', () => {
  it('forgets the offered trip and the declines when the session ends', async () => {
    const { port, entries } = memoryPort();
    const store = createNotificationsPromptStore(port);
    await store.recordOffered(77);
    await store.recordDeclined();
    assert.equal(entries.has(NOTIFICATIONS_PROMPT_KEY), true);

    let handler: (() => void | Promise<void>) | null = null;
    clearPromptStateOnSessionEnd((registered) => {
      handler = registered;
      return () => undefined;
    }, store);
    assert.notEqual(handler, null);
    await (handler as unknown as () => Promise<void>)();

    assert.equal(entries.has(NOTIFICATIONS_PROMPT_KEY), false);
    assert.deepEqual(await store.read(), { declineCount: 0, offeredTripId: null });
  });

  it('does not touch anything until the session ends', async () => {
    const { port, entries } = memoryPort();
    const store = createNotificationsPromptStore(port);
    await store.recordDeclined();
    clearPromptStateOnSessionEnd(() => () => undefined, store);
    assert.equal(entries.has(NOTIFICATIONS_PROMPT_KEY), true);
  });

  it('returns the unsubscribe function of the subscription', () => {
    let unsubscribed = false;
    const unsubscribe = clearPromptStateOnSessionEnd(
      () => () => {
        unsubscribed = true;
      },
      { clear: async () => undefined },
    );
    unsubscribe();
    assert.equal(unsubscribed, true);
  });
});

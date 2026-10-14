import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { QueryClient, QueryObserver, focusManager, onlineManager } from '@tanstack/react-query';

import * as policy from './trip-status-policy.ts';
import {
  TRIP_STATUS_POLL_MS,
  TRIP_STATUS_RESUME_OPTIONS,
  tripStatusRefetchInterval,
} from './trip-status-policy.ts';

const tick = (ms = 20): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

describe('trip status polling', () => {
  it('polls while the trip is open and stops when it is closed', () => {
    assert.equal(tripStatusRefetchInterval(undefined), TRIP_STATUS_POLL_MS);
    assert.equal(tripStatusRefetchInterval({ status: 'assigned' }), TRIP_STATUS_POLL_MS);
    assert.equal(tripStatusRefetchInterval({ status: 'driver_en_route' }), TRIP_STATUS_POLL_MS);
    assert.equal(tripStatusRefetchInterval({ status: 'completed' }), false);
    assert.equal(tripStatusRefetchInterval({ status: 'cancelled_by_passenger' }), false);
  });
});

describe('trip status resume (D-10)', () => {
  it('asks the server again as soon as the app is back in the foreground', async () => {
    const client = new QueryClient();
    client.mount();
    let calls = 0;
    const observer = new QueryObserver(client, {
      queryKey: ['tripRequest', 7],
      queryFn: async () => ({ status: 'assigned', call: ++calls }),
      refetchInterval: (query) => tripStatusRefetchInterval(query.state.data),
      networkMode: 'always',
      ...TRIP_STATUS_RESUME_OPTIONS,
    });
    const unsubscribe = observer.subscribe(() => undefined);
    await tick();
    assert.equal(calls, 1);

    focusManager.setFocused(false);
    await tick();
    assert.equal(calls, 1);

    focusManager.setFocused(true);
    await tick();
    assert.equal(calls, 2);
    assert.equal(observer.getCurrentResult().data?.call, 2);

    unsubscribe();
    client.unmount();
    client.clear();
    focusManager.setFocused(undefined);
  });

  it('refetches even when the previous answer is still fresh', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { staleTime: 60_000 } } });
    client.mount();
    let calls = 0;
    const observer = new QueryObserver(client, {
      queryKey: ['tripRequest', 8],
      queryFn: async () => ++calls,
      networkMode: 'always',
      ...TRIP_STATUS_RESUME_OPTIONS,
    });
    const unsubscribe = observer.subscribe(() => undefined);
    await tick();

    focusManager.setFocused(false);
    focusManager.setFocused(true);
    await tick();
    assert.equal(calls, 2);

    unsubscribe();
    client.unmount();
    client.clear();
    focusManager.setFocused(undefined);
  });
});

describe('active trip after the connection returns (D-PP-05)', () => {
  const ACTIVE_TRIP = { trip_request_id: 77 };

  async function reconnectWith(options: object): Promise<{ calls: number; data: unknown }> {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: 2000, networkMode: 'always' } },
    });
    client.mount();
    let calls = 0;
    let failing = true;
    const observer = new QueryObserver(client, {
      queryKey: ['trips', 'active', 7],
      queryFn: async () => {
        calls += 1;
        if (failing) throw new Error('network');
        return ACTIVE_TRIP;
      },
      ...options,
    });
    const unsubscribe = observer.subscribe(() => undefined);
    onlineManager.setOnline(false);
    await tick();
    assert.equal(observer.getCurrentResult().status, 'error');
    const callsWhileOffline = calls;

    failing = false;
    onlineManager.setOnline(true);
    await tick(50);
    const result = { calls: calls - callsWhileOffline, data: observer.getCurrentResult().data };

    unsubscribe();
    client.unmount();
    client.clear();
    return result;
  }

  it('stays failed after the connection returns when nothing asks again, as the app is configured', async () => {
    const result = await reconnectWith({});
    assert.deepEqual(result, { calls: 0, data: undefined });
  });

  it('asks the server again for the active trip as soon as the connection returns', async () => {
    const result = await reconnectWith({ ...policy.ACTIVE_TRIP_QUERY_OPTIONS });
    assert.deepEqual(result, { calls: 1, data: ACTIVE_TRIP });
  });

  it('does it for a single request, even with the startup and the home watching the same query', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: 2000, networkMode: 'always' } },
    });
    client.mount();
    let calls = 0;
    let failing = true;
    const options = {
      queryKey: ['trips', 'active', 9],
      queryFn: async () => {
        calls += 1;
        if (failing) throw new Error('network');
        return ACTIVE_TRIP;
      },
      ...policy.ACTIVE_TRIP_QUERY_OPTIONS,
    };
    const startup = new QueryObserver(client, options);
    const home = new QueryObserver(client, options);
    const unsubscribes = [startup.subscribe(() => undefined), home.subscribe(() => undefined)];
    onlineManager.setOnline(false);
    await tick();
    const callsWhileOffline = calls;

    failing = false;
    onlineManager.setOnline(true);
    await tick(50);
    assert.equal(calls - callsWhileOffline, 1);
    assert.deepEqual(home.getCurrentResult().data, ACTIVE_TRIP);

    unsubscribes.forEach((unsubscribe) => unsubscribe());
    client.unmount();
    client.clear();
  });

  it('refreshes even when the last answer is still fresh', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: 60_000, networkMode: 'always' } },
    });
    client.mount();
    let calls = 0;
    const observer = new QueryObserver(client, {
      queryKey: ['trips', 'active', 11],
      queryFn: async () => ({ trip_request_id: 77, call: ++calls }),
      ...policy.ACTIVE_TRIP_QUERY_OPTIONS,
    });
    const unsubscribe = observer.subscribe(() => undefined);
    await tick();
    assert.equal(calls, 1);

    onlineManager.setOnline(false);
    onlineManager.setOnline(true);
    await tick(50);
    assert.equal(calls, 2);

    unsubscribe();
    client.unmount();
    client.clear();
  });
});

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { QueryClient, QueryObserver, focusManager } from '@tanstack/react-query';

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

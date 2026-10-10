import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { QueryClient, QueryObserver, focusManager, onlineManager } from '@tanstack/react-query';
import {
  isOnlineState,
  wireFocusToAppState,
  wireOnlineToNetwork,
  type AppStatePort,
  type AppStateStatusLike,
  type NetworkPort,
  type NetworkStateLike,
} from './focus-bridge.ts';

function fakeAppState(): { port: AppStatePort; emit: (status: AppStateStatusLike) => void } {
  const listeners = new Set<(status: AppStateStatusLike) => void>();
  return {
    port: {
      addEventListener: (_type, listener) => {
        listeners.add(listener);
        return { remove: () => listeners.delete(listener) };
      },
    },
    emit: (status) => listeners.forEach((listener) => listener(status)),
  };
}

function fakeNetwork(): { port: NetworkPort; emit: (state: NetworkStateLike) => void } {
  const listeners = new Set<(state: NetworkStateLike) => void>();
  return {
    port: {
      addEventListener: (listener) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
    },
    emit: (state) => listeners.forEach((listener) => listener(state)),
  };
}

const tick = (ms = 20): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

describe('trip status resume (D-10)', () => {
  it('refetches immediately when the app returns to the foreground', async () => {
    const appState = fakeAppState();
    wireFocusToAppState(appState.port, focusManager);

    const client = new QueryClient();
    client.mount();
    let calls = 0;
    const observer = new QueryObserver(client, {
      queryKey: ['trip', 1],
      queryFn: async () => ++calls,
      staleTime: 0,
      refetchOnWindowFocus: 'always',
      networkMode: 'always',
    });
    const unsubscribe = observer.subscribe(() => undefined);
    await tick();
    assert.equal(calls, 1);

    appState.emit('background');
    await tick();
    assert.equal(calls, 1);

    appState.emit('active');
    await tick();
    assert.equal(calls, 2);

    unsubscribe();
    client.unmount();
    client.clear();
  });

  it('does not refetch queries that opted out of focus refetching', async () => {
    const appState = fakeAppState();
    wireFocusToAppState(appState.port, focusManager);

    const client = new QueryClient();
    client.mount();
    let calls = 0;
    const observer = new QueryObserver(client, {
      queryKey: ['quiet'],
      queryFn: async () => ++calls,
      staleTime: 0,
      refetchOnWindowFocus: false,
      networkMode: 'always',
    });
    const unsubscribe = observer.subscribe(() => undefined);
    await tick();

    appState.emit('background');
    appState.emit('active');
    await tick();
    assert.equal(calls, 1);

    unsubscribe();
    client.unmount();
    client.clear();
  });
});

describe('online wiring', () => {
  it('maps connectivity to the online manager', () => {
    const network = fakeNetwork();
    wireOnlineToNetwork(network.port, onlineManager);
    onlineManager.subscribe(() => undefined);

    network.emit({ isConnected: false, isInternetReachable: false });
    assert.equal(onlineManager.isOnline(), false);

    network.emit({ isConnected: true, isInternetReachable: null });
    assert.equal(onlineManager.isOnline(), true);
  });

  it('treats a connected network without internet as offline', () => {
    assert.equal(isOnlineState({ isConnected: true, isInternetReachable: false }), false);
    assert.equal(isOnlineState({ isConnected: true, isInternetReachable: true }), true);
    assert.equal(isOnlineState({ isConnected: null, isInternetReachable: null }), false);
  });
});

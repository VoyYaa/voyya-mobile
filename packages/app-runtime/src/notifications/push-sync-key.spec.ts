import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createStore } from 'zustand/vanilla';
import { pushSyncKey, type PushSyncKey, type PushSyncSessionState } from './push-sync-key.ts';

interface SessionModel extends PushSyncSessionState {
  sessionEpoch: number;
  accessToken: string | null;
}

const GUEST: SessionModel = { status: 'guest', user: null, sessionEpoch: 0, accessToken: null };

function sessionStore(initial: SessionModel = GUEST) {
  const store = createStore<SessionModel>(() => initial);

  const setSession = (user: { pin_change_required: boolean }, accessToken: string): void => {
    store.setState({ sessionEpoch: store.getState().sessionEpoch + 1 });
    store.setState({ status: 'authenticated', user, accessToken });
  };
  const setTokens = (accessToken: string): void => {
    store.setState({ status: 'authenticated', accessToken });
  };
  const clearSession = (): void => {
    store.setState({ sessionEpoch: store.getState().sessionEpoch + 1 });
    store.setState({ status: 'guest', user: null, accessToken: null });
  };

  return { store, setSession, setTokens, clearSession };
}

function syncsOf(store: ReturnType<typeof sessionStore>['store']): PushSyncKey[] {
  const syncs: PushSyncKey[] = [];
  let previous = pushSyncKey(store.getState());
  if (previous !== 'guest') syncs.push(previous);
  store.subscribe((state) => {
    const key = pushSyncKey(state);
    if (key === previous) return;
    previous = key;
    if (key !== 'guest') syncs.push(key);
  });
  return syncs;
}

describe('pushSyncKey: when the push registration syncs again', () => {
  it('syncs once when a driver with a normal PIN signs in, and not again on token refreshes', () => {
    const session = sessionStore();
    const syncs = syncsOf(session.store);
    session.setSession({ pin_change_required: false }, 'access-1');
    session.setTokens('access-2');
    session.setTokens('access-3');
    assert.equal(syncs.length, 1);
  });

  it('syncs once for a passenger session', () => {
    const session = sessionStore();
    const syncs = syncsOf(session.store);
    session.setSession({ pin_change_required: false }, 'access-1');
    assert.equal(syncs.length, 1);
  });

  it('syncs again after a driver with a temporary PIN creates the new one', () => {
    const session = sessionStore();
    const syncs = syncsOf(session.store);

    session.setSession({ pin_change_required: true }, 'temporary-pin-token');
    assert.equal(syncs.length, 1);

    session.setSession({ pin_change_required: false }, 'new-pin-token');
    assert.equal(syncs.length, 2);
  });

  it('syncs only once the new tokens are installed, not when the session epoch rises before them', () => {
    const session = sessionStore();
    session.setSession({ pin_change_required: true }, 'temporary-pin-token');
    const syncs = syncsOf(session.store);
    const tokensAtSync: Array<string | null> = [];
    session.store.subscribe((state) => {
      if (pushSyncKey(state) === 'authenticated' && state.user?.pin_change_required === false) {
        tokensAtSync.push(state.accessToken);
      }
    });

    session.setSession({ pin_change_required: false }, 'new-pin-token');

    assert.equal(syncs.length, 2);
    assert.deepEqual(tokensAtSync, ['new-pin-token']);
  });

  it('does not sync on token refreshes while the PIN is still temporary', () => {
    const session = sessionStore();
    const syncs = syncsOf(session.store);
    session.setSession({ pin_change_required: true }, 'temporary-pin-token');
    session.setTokens('refreshed-token');
    assert.equal(syncs.length, 1);
  });

  it('does not sync when the session ends, and syncs again for the next one', () => {
    const session = sessionStore();
    const syncs = syncsOf(session.store);
    session.setSession({ pin_change_required: false }, 'access-1');
    session.clearSession();
    assert.equal(syncs.length, 1);
    session.setSession({ pin_change_required: false }, 'access-2');
    assert.equal(syncs.length, 2);
  });

  it('treats a session still being restored as no session', () => {
    assert.equal(pushSyncKey({ status: 'hydrating', user: null }), 'guest');
  });
});

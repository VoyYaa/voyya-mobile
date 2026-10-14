import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { runLogoutFlow, type LogoutFlowDeps } from './logout-flow.ts';

interface Harness {
  deps: LogoutFlowDeps;
  calls: string[];
}

function createHarness(overrides: Partial<LogoutFlowDeps> = {}): Harness {
  const calls: string[] = [];
  const deps: LogoutFlowDeps = {
    waitForSessionRefresh: async () => {
      calls.push('waitForSessionRefresh');
    },
    quiescePush: async () => {
      calls.push('quiescePush');
    },
    readRefreshToken: () => 'refresh-token',
    revokePushToken: async () => {
      calls.push('revokePushToken');
    },
    requestLogout: async (refreshToken) => {
      calls.push(`requestLogout:${refreshToken}`);
    },
    forgetPushToken: async () => {
      calls.push('forgetPushToken');
    },
    dismissAllNotifications: async () => {
      calls.push('dismissAllNotifications');
    },
    clearSession: async () => {
      calls.push('clearSession');
    },
    ...overrides,
  };
  return { deps, calls };
}

describe('runLogoutFlow', () => {
  it('runs in order: wait for the refresh, revoke the push token, log out, then clean up', async () => {
    const { deps, calls } = createHarness();
    await runLogoutFlow(deps);
    assert.deepEqual(calls, [
      'waitForSessionRefresh',
      'quiescePush',
      'revokePushToken',
      'requestLogout:refresh-token',
      'forgetPushToken',
      'dismissAllNotifications',
      'clearSession',
    ]);
  });

  it('lets the registration in flight settle before it reads the token to revoke', async () => {
    const { deps, calls } = createHarness();
    await runLogoutFlow(deps);
    assert.ok(calls.indexOf('quiescePush') < calls.indexOf('revokePushToken'));
    assert.ok(calls.indexOf('quiescePush') < calls.indexOf('requestLogout:refresh-token'));
  });

  it('keeps logging out when closing the push registration fails', async () => {
    const { deps, calls } = createHarness({
      quiescePush: async () => {
        throw new Error('registrar');
      },
    });
    await runLogoutFlow(deps);
    assert.ok(calls.includes('revokePushToken'));
    assert.ok(calls.includes('requestLogout:refresh-token'));
    assert.equal(calls.at(-1), 'clearSession');
  });

  it('revokes before the server logout, while the access token is still valid', async () => {
    const { deps, calls } = createHarness();
    await runLogoutFlow(deps);
    assert.ok(calls.indexOf('revokePushToken') < calls.indexOf('requestLogout:refresh-token'));
  });

  it('keeps logging out when the revocation fails or times out', async () => {
    const { deps, calls } = createHarness({
      revokePushToken: async () => {
        throw new Error('timeout');
      },
    });
    await runLogoutFlow(deps);
    assert.ok(calls.includes('requestLogout:refresh-token'));
    assert.ok(calls.includes('forgetPushToken'));
    assert.equal(calls.at(-1), 'clearSession');
  });

  it('forgets the token, empties the tray and clears the session even when the server logout fails', async () => {
    const { deps, calls } = createHarness({
      requestLogout: async () => {
        calls.push('requestLogout');
        throw new Error('503');
      },
    });
    await assert.rejects(runLogoutFlow(deps), /503/);
    assert.deepEqual(calls.slice(-3), [
      'forgetPushToken',
      'dismissAllNotifications',
      'clearSession',
    ]);
  });

  it('clears the session even when forgetting the token or emptying the tray fails', async () => {
    const { deps, calls } = createHarness({
      forgetPushToken: async () => {
        throw new Error('keystore');
      },
      dismissAllNotifications: async () => {
        throw new Error('native');
      },
    });
    await runLogoutFlow(deps);
    assert.equal(calls.at(-1), 'clearSession');
  });

  it('skips the server logout without a refresh token, still revokes the push token and cleans up', async () => {
    const { deps, calls } = createHarness({ readRefreshToken: () => null });
    await runLogoutFlow(deps);
    assert.deepEqual(calls, [
      'waitForSessionRefresh',
      'quiescePush',
      'revokePushToken',
      'forgetPushToken',
      'dismissAllNotifications',
      'clearSession',
    ]);
  });

  it('reads the refresh token after the in-flight refresh settles', async () => {
    let token = 'stale';
    const { deps } = createHarness({
      waitForSessionRefresh: async () => {
        token = 'fresh';
      },
      readRefreshToken: () => token,
    });
    const sent: string[] = [];
    await runLogoutFlow({ ...deps, requestLogout: async (value) => void sent.push(value) });
    assert.deepEqual(sent, ['fresh']);
  });
});

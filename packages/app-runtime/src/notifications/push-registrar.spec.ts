import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { PushTokenPlatform, RegisterPushTokenDTO } from '@voyyaa/shared';
import { ApiError } from '../api/errors.ts';
import type { PushDevicePort, PushDevicePlatform } from './push-device-port.ts';
import type { PushPermissionSnapshot } from './push-permission.ts';
import { createPushRegistrar, type PushRegistrar } from './push-registrar.ts';
import { createPushRevoker, type PushRevoker } from './push-revocation.ts';
import { runLogoutFlow } from '../session/logout-flow.ts';

const TOKEN = 'ExponentPushToken[abcdefghijklmnopqrstuv]';
const CHANNEL_ID = 'trip-updates';

interface Harness {
  registrar: PushRegistrar;
  calls: string[];
  registered: RegisterPushTokenDTO[];
  revoked: string[];
  store: { token: string | null };
  session: { epoch: number };
  revoker: PushRevoker;
  tokenStore: { forget: () => Promise<void> };
  holdRegister: () => () => void;
  device: {
    snapshot: PushPermissionSnapshot;
    afterRequest: PushPermissionSnapshot;
    channelEnabled: boolean;
    tokenError: Error | null;
    registerError: Error | null;
    available: boolean;
    platform: PushDevicePlatform;
    asked: boolean;
  };
}

function createHarness(
  overrides: Partial<Harness['device']> = {},
  supportedPlatforms: readonly PushTokenPlatform[] = ['android'],
): Harness {
  const calls: string[] = [];
  const registered: RegisterPushTokenDTO[] = [];
  const revoked: string[] = [];
  const store: { token: string | null } = { token: null };
  const session = { epoch: 1 };
  let registerGate: Promise<void> | null = null;
  const state: Harness['device'] = {
    snapshot: { status: 'granted', canAskAgain: false },
    afterRequest: { status: 'granted', canAskAgain: false },
    channelEnabled: true,
    tokenError: null,
    registerError: null,
    available: true,
    platform: 'android',
    asked: true,
    ...overrides,
  };
  const device: PushDevicePort = {
    get platform() {
      return state.platform;
    },
    isAvailable: async () => state.available,
    readPermission: async () => {
      calls.push('readPermission');
      return state.snapshot;
    },
    requestPermission: async () => {
      calls.push('requestPermission');
      state.snapshot = state.afterRequest;
      return state.afterRequest;
    },
    isChannelEnabled: async (channelId) => {
      calls.push(`channelEnabled:${channelId}`);
      return state.channelEnabled;
    },
    getExpoPushToken: async () => {
      calls.push('getExpoPushToken');
      if (state.tokenError) throw state.tokenError;
      return TOKEN;
    },
    dismissAllNotifications: async () => undefined,
  };
  const tokenStore = {
    remember: async (token: string) => {
      calls.push('remember');
      store.token = token;
    },
    read: async () => store.token,
    forget: async () => {
      calls.push('forget');
      store.token = null;
    },
  };
  const askedStore = {
    read: async () => state.asked,
    mark: async () => {
      calls.push('markAsked');
      state.asked = true;
    },
  };
  const revoker = createPushRevoker({
    tokenStore,
    revoke: async ({ token }) => {
      calls.push('revoke');
      revoked.push(token);
    },
    deadlineMs: 50,
  });
  const registrar = createPushRegistrar({
    device,
    supportedPlatforms,
    channel: {
      id: CHANNEL_ID,
      ensure: async () => {
        calls.push('ensureChannel');
      },
    },
    register: async (dto) => {
      calls.push('register');
      if (registerGate) await registerGate;
      if (state.registerError) throw state.registerError;
      registered.push(dto);
    },
    tokenStore,
    askedStore,
    revoker,
    sessionEpoch: () => session.epoch,
  });
  const holdRegister = (): (() => void) => {
    let release: () => void = () => undefined;
    registerGate = new Promise<void>((resolve) => {
      release = resolve;
    });
    return release;
  };
  return {
    registrar,
    calls,
    registered,
    revoked,
    store,
    session,
    revoker,
    tokenStore,
    holdRegister,
    device: state,
  };
}

describe('createPushRegistrar', () => {
  it('registers the token when the permission is already granted, without asking', async () => {
    const h = createHarness();
    const outcome = await h.registrar.run({ ask: false, online: true });
    assert.deepEqual(outcome, { permission: 'granted', registration: 'registered' });
    assert.deepEqual(h.registered, [{ token: TOKEN, platform: 'android' }]);
    assert.equal(h.store.token, TOKEN);
    assert.equal(h.calls.includes('requestPermission'), false);
  });

  it('creates the channel before reading or asking for the permission', async () => {
    const h = createHarness({
      snapshot: { status: 'undetermined', canAskAgain: true },
    });
    await h.registrar.run({ ask: true, online: true });
    assert.ok(h.calls.indexOf('ensureChannel') < h.calls.indexOf('readPermission'));
    assert.ok(h.calls.indexOf('ensureChannel') < h.calls.indexOf('requestPermission'));
  });

  it('does not ask for the permission when the caller does not ask for it', async () => {
    const h = createHarness({ snapshot: { status: 'undetermined', canAskAgain: true } });
    const outcome = await h.registrar.run({ ask: false, online: true });
    assert.deepEqual(outcome, { permission: 'undetermined', registration: 'idle' });
    assert.equal(h.calls.includes('requestPermission'), false);
    assert.equal(h.calls.includes('getExpoPushToken'), false);
    assert.deepEqual(h.registered, []);
  });

  it('asks once and registers right after the permission is granted', async () => {
    const h = createHarness({
      snapshot: { status: 'undetermined', canAskAgain: true },
      afterRequest: { status: 'granted', canAskAgain: false },
    });
    const outcome = await h.registrar.run({ ask: true, online: true });
    assert.deepEqual(outcome, { permission: 'granted', registration: 'registered' });
    assert.equal(h.calls.filter((call) => call === 'requestPermission').length, 1);
    assert.ok(h.calls.indexOf('requestPermission') < h.calls.indexOf('register'));
  });

  it('reports a denial, and a block when the system will not ask again', async () => {
    const askable = createHarness({
      snapshot: { status: 'undetermined', canAskAgain: true },
      afterRequest: { status: 'denied', canAskAgain: true },
    });
    assert.deepEqual(await askable.registrar.run({ ask: true, online: true }), {
      permission: 'askable',
      registration: 'idle',
    });
    const blocked = createHarness({
      snapshot: { status: 'denied', canAskAgain: true },
      afterRequest: { status: 'denied', canAskAgain: false },
    });
    assert.deepEqual(await blocked.registrar.run({ ask: true, online: true }), {
      permission: 'blocked',
      registration: 'idle',
    });
  });

  it('reads a first-time report of denied as undetermined, so the sheet still comes first', async () => {
    const h = createHarness({ snapshot: { status: 'denied', canAskAgain: true }, asked: false });
    const outcome = await h.registrar.run({ ask: false, online: true });
    assert.deepEqual(outcome, { permission: 'undetermined', registration: 'idle' });
    assert.equal(h.calls.includes('requestPermission'), false);
  });

  it('remembers that it asked, so a later denial reads as askable and not as first time', async () => {
    const h = createHarness({
      snapshot: { status: 'denied', canAskAgain: true },
      afterRequest: { status: 'denied', canAskAgain: true },
      asked: false,
    });
    const outcome = await h.registrar.run({ ask: true, online: true });
    assert.deepEqual(outcome, { permission: 'askable', registration: 'idle' });
    assert.equal(h.device.asked, true);
  });

  it('does not remember an ask that never happened', async () => {
    const h = createHarness({
      snapshot: { status: 'undetermined', canAskAgain: true },
      asked: false,
    });
    await h.registrar.run({ ask: false, online: true });
    assert.equal(h.calls.includes('markAsked'), false);
  });

  it('never asks again once the system blocked the dialog', async () => {
    const h = createHarness({ snapshot: { status: 'denied', canAskAgain: false } });
    await h.registrar.run({ ask: true, online: true });
    assert.equal(h.calls.includes('requestPermission'), false);
  });

  it('treats a switched-off channel with a granted permission as blocked', async () => {
    const h = createHarness({ channelEnabled: false });
    const outcome = await h.registrar.run({ ask: false, online: true });
    assert.deepEqual(outcome, { permission: 'blocked', registration: 'idle' });
    assert.equal(h.calls.includes('getExpoPushToken'), false);
  });

  it('revokes and forgets the remembered token when the permission was withdrawn (C-4)', async () => {
    const h = createHarness({ snapshot: { status: 'denied', canAskAgain: false } });
    h.store.token = TOKEN;
    await h.registrar.run({ ask: false, online: true });
    assert.deepEqual(h.revoked, [TOKEN]);
    assert.equal(h.store.token, null);
  });

  it('revokes and forgets the remembered token when only the channel was switched off (C-4)', async () => {
    const h = createHarness({ channelEnabled: false });
    h.store.token = TOKEN;
    await h.registrar.run({ ask: false, online: true });
    assert.deepEqual(h.revoked, [TOKEN]);
    assert.equal(h.store.token, null);
  });

  it('forgets the token even when the revocation does not answer in time', async () => {
    const store: { token: string | null } = { token: TOKEN };
    const hung = createPushRegistrar({
      device: {
        platform: 'android',
        isAvailable: async () => true,
        readPermission: async () => ({ status: 'denied', canAskAgain: false }),
        requestPermission: async () => ({ status: 'denied', canAskAgain: false }),
        isChannelEnabled: async () => true,
        getExpoPushToken: async () => TOKEN,
        dismissAllNotifications: async () => undefined,
      },
      supportedPlatforms: ['android'],
      channel: { id: CHANNEL_ID, ensure: async () => undefined },
      register: async () => undefined,
      tokenStore: {
        remember: async () => undefined,
        forget: async () => {
          store.token = null;
        },
      },
      askedStore: { read: async () => true, mark: async () => undefined },
      sessionEpoch: () => 1,
      revoker: { revokeRemembered: async () => 'timeout' },
    });
    await hung.run({ ask: false, online: true });
    assert.equal(store.token, null);
  });

  it('does not revoke anything when the permission is granted', async () => {
    const h = createHarness();
    h.store.token = TOKEN;
    await h.registrar.run({ ask: false, online: true });
    assert.deepEqual(h.revoked, []);
  });

  it('overwrites the remembered token on every successful registration', async () => {
    const h = createHarness();
    h.store.token = 'ExponentPushToken[oldoldoldoldoldoldold]';
    await h.registrar.run({ ask: false, online: true });
    assert.equal(h.store.token, TOKEN);
  });

  it('waits for the connection instead of registering offline', async () => {
    const h = createHarness();
    const outcome = await h.registrar.run({ ask: false, online: false });
    assert.deepEqual(outcome, { permission: 'granted', registration: 'pending_offline' });
    assert.equal(h.calls.includes('getExpoPushToken'), false);
  });

  it('reports a network failure of the server call as pending offline, and keeps the old token', async () => {
    const h = createHarness({ registerError: new ApiError('network', 'sin conexión') });
    h.store.token = 'ExponentPushToken[oldoldoldoldoldoldold]';
    const outcome = await h.registrar.run({ ask: false, online: true });
    assert.deepEqual(outcome, { permission: 'granted', registration: 'pending_offline' });
    assert.equal(h.store.token, 'ExponentPushToken[oldoldoldoldoldoldold]');
  });

  it('reports a failure to obtain the token as failed, without throwing', async () => {
    const h = createHarness({ tokenError: new Error('MISSING_INSTANCEID_SERVICE') });
    const outcome = await h.registrar.run({ ask: false, online: true });
    assert.deepEqual(outcome, { permission: 'granted', registration: 'failed' });
    assert.equal(h.store.token, null);
  });

  it('reports a server rejection as failed', async () => {
    const h = createHarness({ registerError: new ApiError('http', 'rechazado', 400) });
    const outcome = await h.registrar.run({ ask: false, online: true });
    assert.deepEqual(outcome, { permission: 'granted', registration: 'failed' });
  });

  it('is unsupported on a platform the app did not enable, and touches nothing', async () => {
    const h = createHarness({ platform: 'ios' }, ['android']);
    const outcome = await h.registrar.run({ ask: true, online: true });
    assert.deepEqual(outcome, { permission: 'unsupported', registration: 'idle' });
    assert.deepEqual(h.calls, []);
  });

  it('registers iOS when the app enables it, as the driver does', async () => {
    const h = createHarness({ platform: 'ios' }, ['android', 'ios']);
    await h.registrar.run({ ask: false, online: true });
    assert.deepEqual(h.registered, [{ token: TOKEN, platform: 'ios' }]);
  });

  it('is unsupported on the web and when the native module is missing', async () => {
    const web = createHarness({ platform: 'web' });
    assert.equal((await web.registrar.run({ ask: true, online: true })).permission, 'unsupported');
    const missing = createHarness({ available: false });
    assert.equal(
      (await missing.registrar.run({ ask: true, online: true })).permission,
      'unsupported',
    );
    assert.deepEqual(missing.calls, []);
  });

  it('never rejects when the device port fails', async () => {
    const registrar = createPushRegistrar({
      device: {
        platform: 'android',
        isAvailable: async () => true,
        readPermission: async () => {
          throw new Error('native crash');
        },
        requestPermission: async () => ({ status: 'denied', canAskAgain: false }),
        isChannelEnabled: async () => true,
        getExpoPushToken: async () => TOKEN,
        dismissAllNotifications: async () => undefined,
      },
      supportedPlatforms: ['android'],
      channel: { id: CHANNEL_ID, ensure: async () => undefined },
      register: async () => undefined,
      tokenStore: { remember: async () => undefined, forget: async () => undefined },
      askedStore: { read: async () => true, mark: async () => undefined },
      sessionEpoch: () => 1,
      revoker: { revokeRemembered: async () => 'none' },
    });
    const outcome = await registrar.run({ ask: true, online: true });
    assert.deepEqual(outcome, { permission: 'unsupported', registration: 'idle' });
  });

  it('keeps going when the channel cannot be created', async () => {
    const h = createHarness();
    const registrar = createPushRegistrar({
      device: {
        platform: 'android',
        isAvailable: async () => true,
        readPermission: async () => ({ status: 'granted', canAskAgain: false }),
        requestPermission: async () => ({ status: 'granted', canAskAgain: false }),
        isChannelEnabled: async () => true,
        getExpoPushToken: async () => TOKEN,
        dismissAllNotifications: async () => undefined,
      },
      supportedPlatforms: ['android'],
      channel: {
        id: CHANNEL_ID,
        ensure: async () => {
          throw new Error('channel');
        },
      },
      register: async (dto) => {
        h.registered.push(dto);
      },
      tokenStore: { remember: async () => undefined, forget: async () => undefined },
      askedStore: { read: async () => true, mark: async () => undefined },
      sessionEpoch: () => 1,
      revoker: { revokeRemembered: async () => 'none' },
    });
    const outcome = await registrar.run({ ask: false, online: true });
    assert.equal(outcome.registration, 'registered');
  });

  it('runs overlapping requests one after the other', async () => {
    const h = createHarness({
      snapshot: { status: 'undetermined', canAskAgain: true },
      afterRequest: { status: 'denied', canAskAgain: true },
    });
    const first = h.registrar.run({ ask: false, online: true });
    const second = h.registrar.run({ ask: true, online: true });
    assert.equal((await first).permission, 'undetermined');
    assert.equal((await second).permission, 'askable');
    assert.equal(h.calls.filter((call) => call === 'requestPermission').length, 1);
  });
});

async function until(condition: () => boolean): Promise<void> {
  for (let attempt = 0; attempt < 200 && !condition(); attempt += 1) {
    await new Promise<void>((resolve) => setImmediate(resolve));
  }
  assert.ok(condition(), 'the condition never became true');
}

function logoutOf(h: Harness, quiesceDeadlineMs: number): Promise<void> {
  return runLogoutFlow({
    waitForSessionRefresh: async () => undefined,
    quiescePush: () => h.registrar.shutdown(quiesceDeadlineMs),
    readRefreshToken: () => 'refresh-token',
    revokePushToken: () => h.revoker.revokeRemembered(),
    requestLogout: async () => undefined,
    forgetPushToken: () => h.tokenStore.forget(),
    dismissAllNotifications: async () => undefined,
    clearSession: async () => {
      h.session.epoch += 1;
    },
  });
}

describe('logout racing an in-flight registration (PP-01)', () => {
  it('waits for a registration that lands while the logout starts, and revokes that token once', async () => {
    const h = createHarness();
    const release = h.holdRegister();
    const running = h.registrar.run({ ask: false, online: true });
    await until(() => h.calls.includes('register'));

    let loggedOut = false;
    const loggingOut = logoutOf(h, 1000).then(() => {
      loggedOut = true;
    });
    await new Promise<void>((resolve) => setImmediate(resolve));
    await new Promise<void>((resolve) => setImmediate(resolve));
    assert.equal(loggedOut, false);
    release();
    await Promise.all([running, loggingOut]);

    assert.deepEqual(h.revoked, [TOKEN]);
    assert.equal(h.store.token, null);
    assert.equal(h.calls.includes('remember'), false);
    assert.ok(h.calls.indexOf('revoke') > h.calls.indexOf('register'));
  });

  it('ends without a remembered key when the registration resolves after the logout finished', async () => {
    const h = createHarness();
    const release = h.holdRegister();
    const running = h.registrar.run({ ask: false, online: true });
    await until(() => h.calls.includes('register'));

    await logoutOf(h, 10);
    release();
    const outcome = await running;

    assert.equal(h.store.token, null);
    assert.equal(h.calls.includes('remember'), false);
    assert.deepEqual(h.revoked, []);
    assert.deepEqual(outcome, { permission: 'granted', registration: 'idle' });
  });

  it('undoes a registration that lands while the logout is closing but the session still exists', async () => {
    const h = createHarness();
    const release = h.holdRegister();
    const running = h.registrar.run({ ask: false, online: true });
    await until(() => h.calls.includes('register'));

    await h.registrar.shutdown(10);
    release();
    const outcome = await running;

    assert.deepEqual(h.revoked, [TOKEN]);
    assert.equal(h.store.token, null);
    assert.equal(h.calls.includes('remember'), false);
    assert.deepEqual(outcome, { permission: 'granted', registration: 'idle' });
  });

  it('does not remember a token registered by a session that ended without a logout', async () => {
    const h = createHarness();
    const release = h.holdRegister();
    const running = h.registrar.run({ ask: false, online: true });
    await until(() => h.calls.includes('register'));

    h.session.epoch += 1;
    release();
    await running;

    assert.equal(h.store.token, null);
    assert.deepEqual(h.revoked, []);
  });

  it('refuses new runs while the logout is closing, and works again for the next session', async () => {
    const h = createHarness();
    await h.registrar.shutdown(10);

    assert.equal(await h.registrar.run({ ask: false, online: true }), null);
    assert.equal(h.calls.includes('register'), false);

    h.session.epoch += 1;
    const outcome = await h.registrar.run({ ask: false, online: true });
    assert.deepEqual(outcome, { permission: 'granted', registration: 'registered' });
    assert.equal(h.store.token, TOKEN);
  });

  it('lets the run in flight finish, and cancels the runs that had not started when it closed', async () => {
    const h = createHarness();
    const release = h.holdRegister();
    const inFlight = h.registrar.run({ ask: false, online: true });
    await until(() => h.calls.includes('register'));
    const queued = h.registrar.run({ ask: false, online: true });

    const closing = h.registrar.shutdown(1000);
    release();
    await closing;

    assert.equal((await inFlight)?.registration, 'idle');
    assert.equal(await queued, null);
    assert.equal(h.registered.length, 1);
  });

  it('does not make the logout wait longer than the quiesce deadline for a hung registration', async () => {
    const h = createHarness();
    h.holdRegister();
    void h.registrar.run({ ask: false, online: true });
    await until(() => h.calls.includes('register'));

    const startedAt = Date.now();
    await h.registrar.shutdown(30);
    assert.ok(Date.now() - startedAt < 1000);
  });
});

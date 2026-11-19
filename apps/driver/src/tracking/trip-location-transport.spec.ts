import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { LocationAccuracy, SharingStatus } from './sharing-machine.ts';
import { createTransportSwitch, type TripLocationTransport } from './trip-location-transport.ts';

function fakeTransport(
  name: string,
  log: string[],
  accuracy: LocationAccuracy = 'unknown',
): TripLocationTransport {
  return {
    start: async (intervalSec) => {
      log.push(`${name}.start(${intervalSec})`);
    },
    stop: async () => {
      log.push(`${name}.stop`);
    },
    readAccuracy: async () => accuracy,
    readNotificationsGranted: async () => null,
  };
}

function fakeHost(log: string[], initialStatus: SharingStatus = 'idle') {
  let status = initialStatus;
  let chain: Promise<void> = Promise.resolve();
  return {
    host: {
      getStatus: () => status,
      resetMachine: () => {
        log.push('reset');
        status = 'idle';
      },
      enqueue: (task: () => Promise<void>) => {
        chain = chain.then(task);
      },
      whenIdle: () => chain,
    },
    idle: () => chain,
  };
}

describe('createTransportSwitch', () => {
  it('starts with the initial transport', () => {
    const log: string[] = [];
    const initial = fakeTransport('real', log);
    const { host } = fakeHost(log);
    assert.equal(createTransportSwitch(initial, host).current(), initial);
  });

  it('stops the old transport before the new one takes over, in the same queue', async () => {
    const log: string[] = [];
    const real = fakeTransport('real', log);
    const demo = fakeTransport('demo', log);
    const { host, idle } = fakeHost(log);
    const transportSwitch = createTransportSwitch(real, host);

    transportSwitch.swap(demo);
    assert.equal(transportSwitch.current(), real);
    await idle();

    assert.deepEqual(log, ['real.stop']);
    assert.equal(transportSwitch.current(), demo);
  });

  it('resets a running machine first, so the swap always happens at rest', async () => {
    const log: string[] = [];
    const { host, idle } = fakeHost(log, 'running');
    const transportSwitch = createTransportSwitch(fakeTransport('real', log), host);

    transportSwitch.swap(fakeTransport('demo', log));
    await idle();

    assert.deepEqual(log, ['reset', 'real.stop']);
  });

  it('does not reset a machine that is at rest', async () => {
    for (const status of ['idle', 'capped', 'failed', 'precise_needed'] as const) {
      const log: string[] = [];
      const { host, idle } = fakeHost(log, status);
      createTransportSwitch(fakeTransport('real', log), host).swap(fakeTransport('demo', log));
      await idle();
      assert.equal(log.includes('reset'), false, status);
    }
  });

  it('ignores a swap to the transport that is already the target', async () => {
    const log: string[] = [];
    const real = fakeTransport('real', log);
    const { host, idle } = fakeHost(log);
    const transportSwitch = createTransportSwitch(real, host);

    transportSwitch.swap(real);
    await idle();

    assert.deepEqual(log, []);
  });

  it('keeps swapping when the old transport fails to stop', async () => {
    const log: string[] = [];
    const broken: TripLocationTransport = {
      ...fakeTransport('real', log),
      stop: async () => {
        throw new Error('boom');
      },
    };
    const demo = fakeTransport('demo', log);
    const { host, idle } = fakeHost(log);
    const transportSwitch = createTransportSwitch(broken, host);

    transportSwitch.swap(demo);
    await idle();

    assert.equal(transportSwitch.current(), demo);
  });

  it('reads the environment from the transport in place once the queue is idle', async () => {
    const log: string[] = [];
    const real = fakeTransport('real', log, 'none');
    const demo = fakeTransport('demo', log, 'fine');
    const { host } = fakeHost(log);
    const transportSwitch = createTransportSwitch(real, host);

    transportSwitch.swap(demo);

    assert.equal(await transportSwitch.readAccuracy(), 'fine');
    assert.equal(await transportSwitch.readNotificationsGranted(), null);
  });
});

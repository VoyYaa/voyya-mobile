import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import {
  createDemoTransportBinding,
  demoTransportKey,
  type DemoTransportBinding,
} from './demo-transport-binding.ts';
import type { TripLocationTransport } from './trip-location-transport.ts';

function transport(): TripLocationTransport {
  return {
    start: async () => undefined,
    stop: async () => undefined,
    readAccuracy: async () => 'unknown',
    readNotificationsGranted: async () => null,
  };
}

const DEMO_DATA = {
  municipality_id: 7,
  municipality_name: 'Villa Demo',
  center: { lat: 10.25, lng: -20.5 },
  places: [],
};

describe('createDemoTransportBinding', () => {
  const defaultTransport = transport();
  let swaps: TripLocationTransport[];
  let created: Array<{ lat: number; lng: number }>;
  let binding: DemoTransportBinding;

  beforeEach(() => {
    swaps = [];
    created = [];
    binding = createDemoTransportBinding({
      swap: (next) => swaps.push(next),
      defaultTransport,
      createDemoTransport: (center) => {
        created.push(center);
        return transport();
      },
    });
  });

  it('never installs the demo transport for a real session or for no session (risk 1)', () => {
    binding.sync(null);
    binding.sync({ user_id: 5, demo_session: null });
    binding.sync({ user_id: 5, demo_session: null });
    assert.deepEqual(swaps, []);
    assert.deepEqual(created, []);
  });

  it('installs the demo transport on the center of the server demo session, once', () => {
    const user = { user_id: 9, demo_session: DEMO_DATA };
    binding.sync(user);
    binding.sync(user);
    assert.equal(swaps.length, 1);
    assert.deepEqual(created, [DEMO_DATA.center]);
  });

  it('restores the default transport when the session ends', () => {
    binding.sync({ user_id: 9, demo_session: DEMO_DATA });
    binding.sync(null);
    assert.equal(swaps.length, 2);
    assert.equal(swaps[1], defaultTransport);
  });

  it('restores the default transport when a real session follows a demo one', () => {
    binding.sync({ user_id: 9, demo_session: DEMO_DATA });
    binding.sync({ user_id: 12, demo_session: null });
    assert.equal(swaps[1], defaultTransport);
  });

  it('installs a new demo transport when another demo user signs in', () => {
    binding.sync({ user_id: 9, demo_session: DEMO_DATA });
    binding.sync({ user_id: 10, demo_session: DEMO_DATA });
    assert.equal(swaps.length, 2);
    assert.equal(created.length, 2);
  });
});

describe('demoTransportKey', () => {
  it('depends only on demo_session of the user', () => {
    assert.equal(demoTransportKey(null), 'real');
    assert.equal(demoTransportKey({ user_id: 1, demo_session: null }), 'real');
    assert.notEqual(demoTransportKey({ user_id: 1, demo_session: DEMO_DATA }), 'real');
  });
});

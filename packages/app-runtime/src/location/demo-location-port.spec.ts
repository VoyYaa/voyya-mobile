import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { DemoSession } from '@voyyaa/shared';
import type { DeviceLocationPort } from './device-location-port.ts';
import { createDemoLocationPortSync } from './demo-location-port.ts';
import { createFixedLocationPort } from './fixed-location-port.ts';
import { createConsentGatedLocationPort } from './location-gate.ts';

const DEMO: DemoSession = {
  municipality_id: 1,
  municipality_name: 'Villa Demo',
  center: { lat: 1.5, lng: 2.5 },
  places: [],
};

function spyPort(): { port: DeviceLocationPort; calls: () => number } {
  let calls = 0;
  return {
    port: {
      requestLocation: async () => {
        calls += 1;
        return { kind: 'granted', coordinate: { lat: 9, lng: 9 } };
      },
    },
    calls: () => calls,
  };
}

describe('createFixedLocationPort', () => {
  it('answers with the center, never asking for a permission or reading a device', async () => {
    const port = createFixedLocationPort(DEMO.center);
    assert.deepEqual(await port.requestLocation({ timeoutMs: 10 }), {
      kind: 'granted',
      coordinate: { lat: 1.5, lng: 2.5 },
    });
  });

  it('hands out a copy, so a caller cannot move the center', async () => {
    const port = createFixedLocationPort(DEMO.center);
    const first = await port.requestLocation({ timeoutMs: 10 });
    if (first.kind === 'granted') first.coordinate.lat = 99;
    const second = await port.requestLocation({ timeoutMs: 10 });
    assert.deepEqual(second, { kind: 'granted', coordinate: { lat: 1.5, lng: 2.5 } });
  });

  it('keeps the consent gate: without consent it still answers consent_required', async () => {
    const gated = createConsentGatedLocationPort(
      createFixedLocationPort(DEMO.center),
      async () => false,
    );
    assert.deepEqual(await gated.requestLocation({ timeoutMs: 50 }), { kind: 'consent_required' });
  });

  it('answers the center once consent is confirmed', async () => {
    const gated = createConsentGatedLocationPort(
      createFixedLocationPort(DEMO.center),
      async () => true,
    );
    assert.deepEqual(await gated.requestLocation({ timeoutMs: 50 }), {
      kind: 'granted',
      coordinate: { lat: 1.5, lng: 2.5 },
    });
  });
});

describe('createDemoLocationPortSync', () => {
  it('installs the fixed port for a demo session and never touches the real port', async () => {
    const real = spyPort();
    let installed: DeviceLocationPort = real.port;
    const sync = createDemoLocationPortSync((port) => (installed = port), real.port);
    sync.apply(DEMO);
    assert.notEqual(installed, real.port);
    assert.deepEqual(await installed.requestLocation({ timeoutMs: 10 }), {
      kind: 'granted',
      coordinate: { lat: 1.5, lng: 2.5 },
    });
    assert.equal(real.calls(), 0);
  });

  it('keeps the real port for a session without demo data', () => {
    const real = spyPort();
    let installed: DeviceLocationPort | null = null;
    const sync = createDemoLocationPortSync((port) => (installed = port), real.port);
    sync.apply(null);
    assert.equal(installed, real.port);
  });

  it('restores the real port when the session is cleared', () => {
    const real = spyPort();
    let installed: DeviceLocationPort = real.port;
    const sync = createDemoLocationPortSync((port) => (installed = port), real.port);
    sync.apply(DEMO);
    sync.restore();
    assert.equal(installed, real.port);
  });

  it('replaces a demo port with the real one when a real user signs in next', () => {
    const real = spyPort();
    let installed: DeviceLocationPort = real.port;
    const sync = createDemoLocationPortSync((port) => (installed = port), real.port);
    sync.apply(DEMO);
    sync.apply(null);
    assert.equal(installed, real.port);
  });
});

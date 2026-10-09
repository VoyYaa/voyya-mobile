import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { DeviceLocationOutcome, DeviceLocationPort } from './device-location-port.ts';
import { createConsentGatedLocationPort } from './location-gate.ts';

const granted: DeviceLocationOutcome = { kind: 'granted', coordinate: { lat: 6.17, lng: -75.59 } };
const okPort: DeviceLocationPort = { requestLocation: async () => granted };

describe('createConsentGatedLocationPort', () => {
  it('delegates to the port once consent is confirmed', async () => {
    const gated = createConsentGatedLocationPort(okPort, async () => true);
    assert.deepEqual(await gated.requestLocation({ timeoutMs: 50 }), granted);
  });

  it('asks for consent when it is not confirmed', async () => {
    const gated = createConsentGatedLocationPort(okPort, async () => false);
    assert.deepEqual(await gated.requestLocation({ timeoutMs: 50 }), { kind: 'consent_required' });
  });

  it('gives up with a timeout when the consent check never answers', async () => {
    const gated = createConsentGatedLocationPort(
      okPort,
      () => new Promise<boolean>(() => undefined),
    );
    assert.deepEqual(await gated.requestLocation({ timeoutMs: 20 }), {
      kind: 'unavailable',
      reason: 'timeout',
    });
  });
});

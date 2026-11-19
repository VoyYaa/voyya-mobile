import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { DeviceLocationOutcome } from '@voyyaa/app-runtime';
import { resolveOriginOutcome } from './origin-resolution.ts';
import { DEMO_FIXTURE } from './demo-fixtures.ts';

function counting(outcome: DeviceLocationOutcome): {
  request: () => Promise<DeviceLocationOutcome>;
  calls: () => number;
} {
  let calls = 0;
  return {
    request: async () => {
      calls += 1;
      return outcome;
    },
    calls: () => calls,
  };
}

describe('resolveOriginOutcome in a demo session', () => {
  it('resolves the reference point as a manual origin without reading the device (CA-DX-3, CA-DX-6)', async () => {
    const device = counting({ kind: 'granted', coordinate: { lat: 5, lng: 5 } });
    const outcome = await resolveOriginOutcome(DEMO_FIXTURE, device.request);
    assert.deepEqual(outcome, {
      status: 'resolved',
      source: 'manual',
      origin: { address: 'Punto de referencia · Villa Demo', lat: 10.25, lng: -20.5 },
    });
    assert.equal(device.calls(), 0);
  });
});

describe('resolveOriginOutcome in a real session (CA-DX-1)', () => {
  it('resolves the device position as a gps origin', async () => {
    const device = counting({ kind: 'granted', coordinate: { lat: 5, lng: 6 } });
    assert.deepEqual(await resolveOriginOutcome(null, device.request), {
      status: 'resolved',
      source: 'gps',
      origin: { address: 'Tu ubicación actual', lat: 5, lng: 6 },
    });
    assert.equal(device.calls(), 1);
  });

  it('reports a denied permission with whether it can be asked again', async () => {
    const device = counting({ kind: 'permission_denied', canAskAgain: false });
    assert.deepEqual(await resolveOriginOutcome(null, device.request), {
      status: 'unresolved',
      reason: 'permission_denied',
      canAskAgain: false,
    });
  });

  it('reports missing consent and an unavailable position without touching canAskAgain', async () => {
    const consent = await resolveOriginOutcome(
      null,
      counting({ kind: 'consent_required' }).request,
    );
    assert.deepEqual(consent, { status: 'unresolved', reason: 'consent_required' });
    const unavailable = await resolveOriginOutcome(
      null,
      counting({ kind: 'unavailable', reason: 'timeout' }).request,
    );
    assert.deepEqual(unavailable, { status: 'unresolved', reason: 'unavailable' });
  });
});

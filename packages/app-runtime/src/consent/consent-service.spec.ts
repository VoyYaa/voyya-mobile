import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { ConsentStatus } from '@voyyaa/shared';
import {
  createConsentService,
  type ConsentRemote,
  type ConsentService,
  type ConsentStoragePort,
} from './consent-service.ts';
import { createConsentGatedLocationPort } from '../location/location-gate.ts';
import type { DeviceLocationPort } from '../location/device-location-port.ts';

const CURRENT_VERSION = 'location-notice-v2';
const USER_ID = 7;

function status(overrides: Partial<ConsentStatus> = {}): ConsentStatus {
  return {
    purpose: 'location',
    state: 'granted',
    notice_version: CURRENT_VERSION,
    granted_at: '2026-10-08T10:00:00.000Z',
    revoked_at: null,
    current_notice_version: CURRENT_VERSION,
    requires_acceptance: false,
    ...overrides,
  };
}

function networkFailure(): Error {
  return new Error('network');
}

interface Harness {
  service: ConsentService;
  entries: Map<string, string>;
  calls: string[];
  remote: {
    grant: ConsentRemote['grant'];
    revoke: ConsentRemote['revoke'];
    list: ConsentRemote['list'];
  };
  setUserId: (id: number | null) => void;
  gps: { reads: number };
  gatedPort: DeviceLocationPort;
}

function createHarness(): Harness {
  const entries = new Map<string, string>();
  const calls: string[] = [];
  let userId: number | null = USER_ID;
  const storage: ConsentStoragePort = {
    getItem: async (key) => entries.get(key) ?? null,
    setItem: async (key, value) => {
      entries.set(key, value);
    },
    deleteItem: async (key) => {
      entries.delete(key);
    },
  };
  const remote = {
    grant: async (): Promise<ConsentStatus> => {
      calls.push('grant');
      return status();
    },
    revoke: async (): Promise<ConsentStatus> => {
      calls.push('revoke');
      return status({ state: 'revoked', revoked_at: '2026-10-08T11:00:00.000Z' });
    },
    list: async (): Promise<ConsentStatus[]> => {
      calls.push('list');
      return [status()];
    },
  };
  const service = createConsentService({
    remote,
    getStorage: () => storage,
    getUserId: () => userId,
    currentVersion: CURRENT_VERSION,
    now: () => '2026-10-08T10:00:01.000Z',
  });
  const gps = { reads: 0 };
  const gatedPort = createConsentGatedLocationPort(
    {
      requestLocation: async () => {
        gps.reads += 1;
        return { kind: 'granted', coordinate: { lat: 6.9591, lng: -75.4181 } };
      },
    },
    () => service.isConfirmed('location'),
  );
  return { service, entries, calls, remote, setUserId: (id) => (userId = id), gps, gatedPort };
}

describe('consent service and GPS gate (ADR-029 §4)', () => {
  let h: Harness;

  beforeEach(() => {
    h = createHarness();
  });

  it('never reads the GPS before the server confirmed the consent', async () => {
    const outcome = await h.gatedPort.requestLocation({ timeoutMs: 1000 });

    assert.deepEqual(outcome, { kind: 'consent_required' });
    assert.equal(h.gps.reads, 0);
  });

  it('reads the GPS only after POST /consents answered 200 granted', async () => {
    await h.service.grant('location');
    const outcome = await h.gatedPort.requestLocation({ timeoutMs: 1000 });

    assert.equal(outcome.kind, 'granted');
    assert.equal(h.gps.reads, 1);
    assert.deepEqual(h.calls, ['grant']);
  });

  it('a failed grant (no network) leaves the GPS blocked', async () => {
    h.remote.grant = async () => {
      throw networkFailure();
    };

    await assert.rejects(h.service.grant('location'));
    assert.equal(await h.service.isConfirmed('location'), false);
  });

  it('a server answer that is not granted for the current version does not unlock the GPS', async () => {
    h.remote.grant = async () =>
      status({ state: 'none', notice_version: null, requires_acceptance: true });

    await h.service.grant('location');

    assert.equal(await h.service.isConfirmed('location'), false);
  });

  it('revoking blocks the GPS again, even if the revoke request fails', async () => {
    await h.service.grant('location');
    h.remote.revoke = async () => {
      throw networkFailure();
    };

    await assert.rejects(h.service.revoke('location'));

    assert.equal(await h.service.isConfirmed('location'), false);
  });

  it('a revoked answer from the server keeps the GPS blocked', async () => {
    await h.service.grant('location');

    const result = await h.service.revoke('location');

    assert.equal(result.state, 'revoked');
    assert.equal(await h.service.isConfirmed('location'), false);
    assert.deepEqual(await h.gatedPort.requestLocation({ timeoutMs: 1 }), {
      kind: 'consent_required',
    });
  });

  it('refresh restores the confirmation when the server still says granted', async () => {
    const result = await h.service.refresh('location');

    assert.equal(result.state, 'granted');
    assert.equal(await h.service.isConfirmed('location'), true);
  });

  it('refresh clears the confirmation when the server says revoked (revoked from another device)', async () => {
    await h.service.grant('location');
    h.remote.list = async () => [
      status({ state: 'revoked', revoked_at: '2026-10-08T12:00:00.000Z' }),
    ];

    await h.service.refresh('location');

    assert.equal(await h.service.isConfirmed('location'), false);
  });

  it('refresh with no record on the server answers none and blocks', async () => {
    await h.service.grant('location');
    h.remote.list = async () => [];

    const result = await h.service.refresh('location');

    assert.equal(result.state, 'none');
    assert.equal(result.requires_acceptance, true);
    assert.equal(await h.service.isConfirmed('location'), false);
  });

  it('refresh without network keeps the last known confirmation', async () => {
    await h.service.grant('location');
    h.remote.list = async () => {
      throw networkFailure();
    };

    await assert.rejects(h.service.refresh('location'));

    assert.equal(await h.service.isConfirmed('location'), true);
  });

  it('a confirmation recorded for an older notice version does not unlock the GPS', async () => {
    h.entries.set(
      `voyya_consent_v2_location_${USER_ID}`,
      JSON.stringify({ version: 'location-notice-v1', confirmedAt: 'x' }),
    );

    assert.equal(await h.service.isConfirmed('location'), false);
  });

  it('a corrupted stored flag blocks the GPS', async () => {
    h.entries.set(`voyya_consent_v2_location_${USER_ID}`, '{not json');

    assert.equal(await h.service.isConfirmed('location'), false);
  });

  it('the confirmation belongs to the user: another user on the same device is blocked', async () => {
    await h.service.grant('location');
    h.setUserId(8);

    assert.equal(await h.service.isConfirmed('location'), false);
  });

  it('with no session the GPS is blocked', async () => {
    await h.service.grant('location');
    h.setUserId(null);

    assert.equal(await h.service.isConfirmed('location'), false);
  });

  it('forget removes the confirmation (403 LOCATION_CONSENT_REQUIRED path)', async () => {
    await h.service.grant('location');

    await h.service.forget('location');

    assert.equal(await h.service.isConfirmed('location'), false);
    assert.equal(h.gps.reads, 0);
  });
});

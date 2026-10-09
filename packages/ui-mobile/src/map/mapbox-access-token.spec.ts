import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createAccessTokenApplier } from './mapbox-access-token.ts';

function recordingTarget(): {
  calls: string[];
  target: Parameters<typeof createAccessTokenApplier>[0];
} {
  const calls: string[] = [];
  return {
    calls,
    target: {
      setAccessToken: (token) => calls.push(`token:${token}`),
      setTelemetryEnabled: (enabled) => calls.push(`telemetry:${String(enabled)}`),
    },
  };
}

describe('createAccessTokenApplier', () => {
  it('sets the access token before touching any other Mapbox setting', () => {
    const { calls, target } = recordingTarget();
    createAccessTokenApplier(target)('pk.test');
    assert.deepEqual(calls, ['token:pk.test', 'telemetry:false']);
  });

  it('does not repeat the calls for the same token', () => {
    const { calls, target } = recordingTarget();
    const apply = createAccessTokenApplier(target);
    apply('pk.test');
    apply('pk.test');
    assert.equal(calls.length, 2);
  });

  it('applies a different token again, token first', () => {
    const { calls, target } = recordingTarget();
    const apply = createAccessTokenApplier(target);
    apply('pk.one');
    apply('pk.two');
    assert.deepEqual(calls, ['token:pk.one', 'telemetry:false', 'token:pk.two', 'telemetry:false']);
  });
});

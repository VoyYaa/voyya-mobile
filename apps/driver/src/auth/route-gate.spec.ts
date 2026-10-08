import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { resolveGateRedirect, type RouteGateInput } from './route-gate.ts';

const base: RouteGateInput = {
  status: 'authenticated',
  inAuthGroup: false,
  onCreatePin: false,
  pinRequired: false,
  celebrating: false,
};

function gate(overrides: Partial<RouteGateInput>): ReturnType<typeof resolveGateRedirect> {
  return resolveGateRedirect({ ...base, ...overrides });
}

describe('resolveGateRedirect', () => {
  it('does nothing while the session hydrates', () => {
    assert.equal(gate({ status: 'hydrating' }), null);
  });

  it('sends guests to login, also away from create-pin', () => {
    assert.equal(gate({ status: 'guest' }), '/(auth)/login');
    assert.equal(gate({ status: 'guest', inAuthGroup: true }), null);
    assert.equal(gate({ status: 'guest', inAuthGroup: true, onCreatePin: true }), '/(auth)/login');
  });

  it('locks a driver with a pending PIN to create-pin from any route', () => {
    assert.equal(gate({ pinRequired: true }), '/(auth)/create-pin');
    assert.equal(gate({ pinRequired: true, inAuthGroup: true }), '/(auth)/create-pin');
    assert.equal(gate({ pinRequired: true, inAuthGroup: true, onCreatePin: true }), null);
  });

  it('lets a driver with a personal PIN reach the app and bounces auth routes to home', () => {
    assert.equal(gate({}), null);
    assert.equal(gate({ inAuthGroup: true }), '/');
    assert.equal(gate({ inAuthGroup: true, onCreatePin: true }), '/');
  });

  it('keeps create-pin visible while the success state plays', () => {
    assert.equal(gate({ inAuthGroup: true, onCreatePin: true, celebrating: true }), null);
  });
});

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { startupGateView, type GateStartup, type GateTap } from './startup-gate-view.ts';

function startup(overrides: Partial<GateStartup> = {}): GateStartup {
  return { phase: 'done', restored: false, ...overrides };
}

function tap(phase: GateTap['phase']): GateTap {
  return { phase };
}

describe('startupGateView', () => {
  describe('as before the offline code cycle (nothing restored)', () => {
    it('shows nothing when startup is done and no tap is pending', () => {
      assert.deepEqual(startupGateView(startup(), tap('idle')), { kind: 'none' });
    });

    it('shows nothing while the session is idle', () => {
      assert.deepEqual(startupGateView(startup({ phase: 'idle' }), tap('idle')), { kind: 'none' });
    });

    it('shows the checking veil while the startup looks for an active trip', () => {
      assert.deepEqual(startupGateView(startup({ phase: 'checking' }), tap('idle')), {
        kind: 'veil',
        label: 'checking',
      });
    });

    it('shows the opening veil while a tapped notification is resolved', () => {
      assert.deepEqual(startupGateView(startup(), tap('resolving')), {
        kind: 'veil',
        label: 'opening',
      });
    });

    it('keeps the opening label when a tap is pending while the startup is still checking', () => {
      assert.deepEqual(startupGateView(startup({ phase: 'checking' }), tap('resolving')), {
        kind: 'veil',
        label: 'opening',
      });
    });

    it('shows the failure panel of the startup, offline or with an error', () => {
      for (const phase of ['offline', 'error'] as const) {
        assert.deepEqual(startupGateView(startup({ phase }), tap('idle')), {
          kind: 'failed',
          phase,
          source: 'startup',
        });
      }
    });

    it('shows the failure panel of a tap, offline or with an error', () => {
      for (const phase of ['offline', 'error'] as const) {
        assert.deepEqual(startupGateView(startup(), tap(phase)), {
          kind: 'failed',
          phase,
          source: 'tap',
        });
      }
    });

    it('prefers the failure of the startup to the one of the tap', () => {
      assert.deepEqual(startupGateView(startup({ phase: 'offline' }), tap('error')), {
        kind: 'failed',
        phase: 'offline',
        source: 'startup',
      });
    });
  });

  describe('with the startup restored from the saved code (D-CS-10)', () => {
    const restored = startup({ restored: true });

    it('does not paint the opening veil over the code while a tap is resolved', () => {
      assert.deepEqual(startupGateView(restored, tap('resolving')), { kind: 'none' });
    });

    it('does not paint the failure panel of a tap over the code', () => {
      for (const phase of ['offline', 'error'] as const) {
        assert.deepEqual(startupGateView(restored, tap(phase)), { kind: 'none' }, phase);
      }
    });

    it('shows nothing when nothing is going on', () => {
      assert.deepEqual(startupGateView(restored, tap('idle')), { kind: 'none' });
    });
  });
});

export type GateStartupPhase = 'idle' | 'checking' | 'error' | 'offline' | 'done';
export type GateTapPhase = 'idle' | 'resolving' | 'offline' | 'error';

export interface GateStartup {
  phase: GateStartupPhase;
  restored: boolean;
}

export interface GateTap {
  phase: GateTapPhase;
}

export type StartupGateView =
  | { kind: 'none' }
  | { kind: 'veil'; label: 'checking' | 'opening' }
  | { kind: 'failed'; phase: 'offline' | 'error'; source: 'startup' | 'tap' };

function failurePhase(phase: GateStartupPhase | GateTapPhase): 'offline' | 'error' | null {
  return phase === 'offline' || phase === 'error' ? phase : null;
}

export function startupGateView(startup: GateStartup, tap: GateTap): StartupGateView {
  const startupFailure = failurePhase(startup.phase);
  if (startupFailure !== null) return { kind: 'failed', phase: startupFailure, source: 'startup' };
  if (startup.restored) return { kind: 'none' };

  const tapFailure = failurePhase(tap.phase);
  if (tapFailure !== null) return { kind: 'failed', phase: tapFailure, source: 'tap' };
  if (tap.phase === 'resolving') return { kind: 'veil', label: 'opening' };
  return startup.phase === 'checking' ? { kind: 'veil', label: 'checking' } : { kind: 'none' };
}

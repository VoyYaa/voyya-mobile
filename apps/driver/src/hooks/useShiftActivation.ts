import { domainErrorCode, isNetworkError, requestDeviceLocation } from '@voyyaa/app-runtime';
import { type ShiftActivationPhase, useShiftStore } from '../state/useShiftStore';
import { useUpdateShift } from './useUpdateShift';

export type { ShiftActivationPhase };

export interface ShiftActivation {
  phase: ShiftActivationPhase;
  isBusy: boolean;
  activate: () => void;
  deactivate: () => void;
  retry: () => void;
  dismissIssue: () => void;
}

export function useShiftActivation(): ShiftActivation {
  const phase = useShiftStore((s) => s.phase);
  const setPhase = useShiftStore((s) => s.setPhase);
  const setLastAction = useShiftStore((s) => s.setLastAction);
  const lastAction = useShiftStore((s) => s.lastAction);
  const updateShift = useUpdateShift();

  function activate(): void {
    setLastAction('activate');
    setPhase('requesting_permission');
    void requestDeviceLocation().then((outcome) => {
      if (outcome.kind === 'permission_denied') {
        setPhase('permission_denied');
        return;
      }
      if (outcome.kind === 'unavailable') {
        setPhase('gps_disabled');
        return;
      }
      setPhase('activating');
      updateShift.mutate(
        { on_shift: true, location: outcome.coordinate },
        {
          onSuccess: () => setPhase('idle'),
          onError: (error) => setPhase(isNetworkError(error) ? 'offline' : 'server_error'),
        },
      );
    });
  }

  function deactivate(): void {
    setLastAction('deactivate');
    setPhase('activating');
    updateShift.mutate(
      { on_shift: false },
      {
        onSuccess: () => setPhase('idle'),
        onError: (error) => {
          if (isNetworkError(error)) {
            setPhase('offline');
            return;
          }
          const code = domainErrorCode(error);
          setPhase(code === 'ACTIVE_TRIP_IN_PROGRESS' ? 'blocked_by_trip' : 'server_error');
        },
      },
    );
  }

  function retry(): void {
    if (lastAction === 'deactivate') {
      deactivate();
    } else {
      activate();
    }
  }

  function dismissIssue(): void {
    setPhase('idle');
  }

  return {
    phase,
    isBusy: phase === 'requesting_permission' || phase === 'activating',
    activate,
    deactivate,
    retry,
    dismissIssue,
  };
}

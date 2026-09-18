import { useCallback, useState } from 'react';
import type { Location } from '@voyyaa/shared';
import { requestDeviceLocation } from '@voyyaa/app-runtime';

export type OriginResolutionStatus = 'idle' | 'resolving' | 'resolved' | 'unresolved';
export type OriginUnresolvedReason = 'permission_denied' | 'unavailable' | null;

export interface OriginResolution {
  status: OriginResolutionStatus;
  origin: Location | null;
  canAskAgain: boolean;
  unresolvedReason: OriginUnresolvedReason;
  resolve: () => void;
}

export function useResolveOrigin(): OriginResolution {
  const [status, setStatus] = useState<OriginResolutionStatus>('idle');
  const [origin, setOrigin] = useState<Location | null>(null);
  const [canAskAgain, setCanAskAgain] = useState(true);
  const [unresolvedReason, setUnresolvedReason] = useState<OriginUnresolvedReason>(null);

  const resolve = useCallback((): void => {
    setStatus('resolving');
    void requestDeviceLocation().then((outcome) => {
      if (outcome.kind === 'granted') {
        setOrigin({ address: 'Tu ubicación actual', ...outcome.coordinate });
        setUnresolvedReason(null);
        setStatus('resolved');
        return;
      }
      if (outcome.kind === 'permission_denied') {
        setCanAskAgain(outcome.canAskAgain);
        setUnresolvedReason('permission_denied');
      } else {
        setUnresolvedReason('unavailable');
      }
      setStatus('unresolved');
    });
  }, []);

  return { status, origin, canAskAgain, unresolvedReason, resolve };
}

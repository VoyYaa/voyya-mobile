import { useCallback, useState } from 'react';
import type { Location } from '@voyyaa/shared';
import { requestDeviceLocation, useDemoSession } from '@voyyaa/app-runtime';
import { resolveOriginOutcome, type OriginUnresolvedReason } from '../lib/origin-resolution';
import type { OriginSource } from '../state/useTripDraftStore';

export type OriginResolutionStatus = 'idle' | 'resolving' | 'resolved' | 'unresolved';

export interface OriginResolution {
  status: OriginResolutionStatus;
  origin: Location | null;
  originSource: OriginSource;
  canAskAgain: boolean;
  unresolvedReason: OriginUnresolvedReason | null;
  resolve: () => void;
}

export function useResolveOrigin(): OriginResolution {
  const demo = useDemoSession();
  const [status, setStatus] = useState<OriginResolutionStatus>('idle');
  const [origin, setOrigin] = useState<Location | null>(null);
  const [originSource, setOriginSource] = useState<OriginSource>('gps');
  const [canAskAgain, setCanAskAgain] = useState(true);
  const [unresolvedReason, setUnresolvedReason] = useState<OriginUnresolvedReason | null>(null);

  const resolve = useCallback((): void => {
    setStatus('resolving');
    void resolveOriginOutcome(demo, requestDeviceLocation).then((outcome) => {
      if (outcome.status === 'resolved') {
        setOrigin(outcome.origin);
        setOriginSource(outcome.source);
        setUnresolvedReason(null);
        setStatus('resolved');
        return;
      }
      if (outcome.canAskAgain !== undefined) setCanAskAgain(outcome.canAskAgain);
      setUnresolvedReason(outcome.reason);
      setStatus('unresolved');
    });
  }, [demo]);

  return { status, origin, originSource, canAskAgain, unresolvedReason, resolve };
}

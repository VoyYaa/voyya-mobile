import { useEffect, useState } from 'react';
import type { Location } from '@voyyaa/shared';
import { quoteFare } from '../api/trips.api';
import { domainErrorCode, isNetworkError } from '@voyyaa/app-runtime';

export type CoverageGateStatus = 'idle' | 'checking' | 'within' | 'outside' | 'error';

export interface CoverageGate {
  status: CoverageGateStatus;
  retry: () => void;
}

export function useCoverageGate(origin: Location | null, municipalityId: number): CoverageGate {
  const [status, setStatus] = useState<CoverageGateStatus>('idle');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!origin) {
      setStatus('idle');
      return;
    }

    let current = true;
    setStatus('checking');

    quoteFare({
      origin,
      destination: origin,
      municipality_id: municipalityId,
      service_type: 'taxi',
    })
      .then(() => {
        if (current) setStatus('within');
      })
      .catch((error: unknown) => {
        if (!current) return;
        if (isNetworkError(error)) {
          setStatus('within');
          return;
        }
        setStatus(domainErrorCode(error) === 'OUT_OF_COVERAGE' ? 'outside' : 'error');
      });

    return () => {
      current = false;
    };
  }, [origin?.lat, origin?.lng, municipalityId, attempt]);

  return { status, retry: () => setAttempt((n) => n + 1) };
}

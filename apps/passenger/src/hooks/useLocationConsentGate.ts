import { useEffect, useState } from 'react';
import type { ConsentStatus } from '@voyyaa/shared';
import { phaseOfStatus, type LocationConsentPhase } from '../lib/consent-phase';
import {
  isLocationConsentConfirmed,
  useLocationConsentStatus,
  useNetworkStatus,
} from '@voyyaa/app-runtime';

export interface LocationConsentGate {
  phase: LocationConsentPhase;
  status: ConsentStatus | null;
  retry: () => void;
}

export function useLocationConsentGate(): LocationConsentGate {
  const query = useLocationConsentStatus();
  const network = useNetworkStatus();
  const [localConfirmed, setLocalConfirmed] = useState<boolean | null>(null);

  useEffect(() => {
    let current = true;
    void isLocationConsentConfirmed().then((confirmed) => {
      if (current) setLocalConfirmed(confirmed);
    });
    return () => {
      current = false;
    };
  }, [query.data]);

  const retry = (): void => {
    void query.refetch();
  };

  if (query.data) return { phase: phaseOfStatus(query.data), status: query.data, retry };
  if (localConfirmed === null) return { phase: 'checking', status: null, retry };
  if (localConfirmed) return { phase: 'confirmed', status: null, retry };
  if (query.isError || network === 'offline') return { phase: 'unknown', status: null, retry };
  return { phase: 'checking', status: null, retry };
}

import { useEffect, useState } from 'react';
import type { ConsentStatus } from '@voyyaa/shared';
import {
  consentGatePhase,
  freshConsentStatus,
  type LocationConsentPhase,
} from '../lib/consent-phase';
import {
  isLocationConsentConfirmed,
  useLocationConsentStatus,
  useNetworkStatus,
  useSessionStore,
} from '@voyyaa/app-runtime';

export interface LocationConsentGate {
  phase: LocationConsentPhase;
  status: ConsentStatus | null;
  retry: () => void;
}

export function useLocationConsentGate(): LocationConsentGate {
  const query = useLocationConsentStatus();
  const network = useNetworkStatus();
  const userId = useSessionStore((s) => s.user?.user_id ?? null);
  const sessionStartedAt = useSessionStore((s) => s.sessionStartedAt);
  const [localConfirmed, setLocalConfirmed] = useState<boolean | null>(null);

  useEffect(() => {
    let current = true;
    void isLocationConsentConfirmed().then((confirmed) => {
      if (current) setLocalConfirmed(confirmed);
    });
    return () => {
      current = false;
    };
  }, [query.data, userId]);

  const retry = (): void => {
    void query.refetch();
  };

  const status = freshConsentStatus(query.data, query.dataUpdatedAt, sessionStartedAt);
  const phase = consentGatePhase({
    status,
    localConfirmed,
    failed: query.isError,
    offline: network === 'offline',
  });
  return { phase, status, retry };
}

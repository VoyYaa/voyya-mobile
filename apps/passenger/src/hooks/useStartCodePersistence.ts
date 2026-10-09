import { useEffect, useState } from 'react';
import type { TripRequestStatus } from '@voyyaa/shared';
import { startCodeStore } from '../lib/start-code-runtime';

export function usePersistStartCode(data: TripRequestStatus | undefined): void {
  const tripRequestId = data?.trip_request_id;
  const code = data?.start_code ?? null;
  const state = data?.start_code_state;

  useEffect(() => {
    if (tripRequestId === undefined || state === undefined) return;
    void startCodeStore.sync(tripRequestId, { start_code: code, start_code_state: state });
  }, [tripRequestId, code, state]);
}

export function useSavedStartCode(tripRequestId: number | null, enabled: boolean): string | null {
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || tripRequestId === null) return;
    let cancelled = false;
    void startCodeStore.read(tripRequestId).then((code) => {
      if (!cancelled) setSaved(code);
    });
    return () => {
      cancelled = true;
    };
  }, [tripRequestId, enabled]);

  return saved;
}

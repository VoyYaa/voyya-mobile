import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSessionStore } from '@voyyaa/app-runtime';
import { isSessionFresh } from '../lib/session-freshness';
import { toServerStartCode } from '../lib/start-code-record';
import { startCodeRecordStore } from '../lib/start-code-runtime';
import { tripRequestQueryKey, useActiveTrip, useActiveTripCache } from './useActiveTrip';

export function useStartCodeReconciler(): void {
  const queryClient = useQueryClient();
  const { data, dataUpdatedAt } = useActiveTrip();
  const cache = useActiveTripCache();
  const userId = useSessionStore((s) => s.user?.user_id ?? null);
  const sessionStartedAt = useSessionStore((s) => s.sessionStartedAt);

  useEffect(() => {
    if (data === undefined || userId === null) return;
    if (!isSessionFresh(dataUpdatedAt, sessionStartedAt)) return;

    if (data !== null) {
      const snapshot = startCodeRecordStore.getSnapshot();
      const sameTrip =
        snapshot.kind === 'present' && snapshot.record.trip_request_id === data.trip_request_id;
      const cached = queryClient.getQueryData(tripRequestQueryKey(data.trip_request_id));
      if (sameTrip && cached === undefined) cache.seed(data);
    }
    void startCodeRecordStore.reconcile(data === null ? null : toServerStartCode(data), userId);
  }, [dataUpdatedAt, userId, sessionStartedAt]);
}

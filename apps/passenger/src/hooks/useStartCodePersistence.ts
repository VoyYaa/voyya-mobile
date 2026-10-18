import { useEffect, useSyncExternalStore } from 'react';
import type { TripRequestStatus } from '@voyyaa/shared';
import { useSessionStore } from '@voyyaa/app-runtime';
import { START_CODE_RECORD_TTL_MS } from '../constants/parameters';
import { isSessionFresh } from '../lib/session-freshness';
import {
  msUntilExpiry,
  toServerStartCode,
  usableRecord,
  type StartCodeRecord,
} from '../lib/start-code-record';
import { startCodeRecordStore } from '../lib/start-code-runtime';

export function usePersistStartCode(
  data: TripRequestStatus | undefined,
  dataUpdatedAt: number,
): void {
  const userId = useSessionStore((s) => s.user?.user_id ?? null);
  const sessionStartedAt = useSessionStore((s) => s.sessionStartedAt);

  useEffect(() => {
    if (data === undefined || userId === null) return;
    if (!isSessionFresh(dataUpdatedAt, sessionStartedAt)) return;
    void startCodeRecordStore.sync(toServerStartCode(data), userId);
  }, [dataUpdatedAt, userId, sessionStartedAt]);
}

export function useRestoredStartCode(tripRequestId: number | null): StartCodeRecord | null {
  const snapshot = useSyncExternalStore(
    startCodeRecordStore.subscribe,
    startCodeRecordStore.getSnapshot,
  );
  const userId = useSessionStore((s) => s.user?.user_id ?? null);
  const record = usableRecord(snapshot, {
    tripRequestId,
    userId,
    now: Date.now(),
    ttlMs: START_CODE_RECORD_TTL_MS,
  });

  useEffect(() => {
    if (record === null) return;
    const timer = setTimeout(
      () => void startCodeRecordStore.clear(),
      msUntilExpiry(record, Date.now(), START_CODE_RECORD_TTL_MS),
    );
    return () => clearTimeout(timer);
  }, [record]);

  return record;
}

import { useEffect } from 'react';
import { useTripDraftStore } from '../state/useTripDraftStore';
import { pickupOriginStore } from '../lib/pickup-origin-runtime';

export function usePickupOriginPersistence(
  tripRequestId: number | null,
  canRestore: boolean,
): void {
  const origin = useTripDraftStore((s) => s.origin);
  const setOrigin = useTripDraftStore((s) => s.setOrigin);
  const hasOrigin = origin !== null;

  useEffect(() => {
    if (tripRequestId === null || origin === null) return;
    void pickupOriginStore.save(tripRequestId, origin);
  }, [tripRequestId, origin]);

  useEffect(() => {
    if (tripRequestId === null || hasOrigin || !canRestore) return;
    let cancelled = false;
    void pickupOriginStore.read(tripRequestId).then((restored) => {
      if (!cancelled && restored !== null) setOrigin(restored, 'manual');
    });
    return () => {
      cancelled = true;
    };
  }, [tripRequestId, hasOrigin, canRestore, setOrigin]);
}

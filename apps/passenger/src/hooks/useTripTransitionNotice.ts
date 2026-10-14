import { useEffect } from 'react';
import { AccessibilityInfo } from 'react-native';
import type { TripRequestStatus } from '@voyyaa/shared';
import { transitionNoticeText } from '../lib/trip-transition';
import { useTripTransitionStore } from '../state/useTripTransitionStore';

export function useTripTransitionNotice(data: TripRequestStatus | undefined): void {
  const observe = useTripTransitionStore((s) => s.observe);
  const tripRequestId = data?.trip_request_id;
  const status = data?.status;
  const arrivedAt = data?.arrived_at ?? null;

  useEffect(() => {
    if (tripRequestId === undefined || status === undefined) return;
    const kind = observe({ tripRequestId, status, arrivedAt });
    if (kind !== null) AccessibilityInfo.announceForAccessibility(transitionNoticeText(kind));
  }, [tripRequestId, status, arrivedAt, observe]);
}

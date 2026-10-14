import type { TripStatus } from '@voyyaa/shared';
import { notificationsCopy } from '../copy/notifications-copy';

export type TripTransitionNotice =
  'driver_cancelled_searching' | 'driver_cancelled_ended' | 'driver_arrived' | 'no_driver';

export interface TripSnapshot {
  tripRequestId: number;
  status: TripStatus;
  arrivedAt: string | null;
}

export function detectTripTransition(
  previous: TripSnapshot | null,
  next: TripSnapshot,
): TripTransitionNotice | null {
  if (previous === null || previous.tripRequestId !== next.tripRequestId) return null;

  if (previous.status === 'assigned' && next.status === 'pending_assignment') {
    return 'driver_cancelled_searching';
  }
  if (
    (previous.status === 'assigned' || previous.status === 'driver_en_route') &&
    next.status === 'cancelled_by_driver'
  ) {
    return 'driver_cancelled_ended';
  }
  if (
    previous.status === 'driver_en_route' &&
    next.status === 'driver_en_route' &&
    previous.arrivedAt === null &&
    next.arrivedAt !== null
  ) {
    return 'driver_arrived';
  }
  if (previous.status === 'pending_assignment' && next.status === 'no_driver') return 'no_driver';
  return null;
}

const TEXT_BY_NOTICE: Record<TripTransitionNotice, string> = {
  driver_cancelled_searching: notificationsCopy.foreground.driverCancelledSearching,
  driver_cancelled_ended: notificationsCopy.foreground.driverCancelledEnded,
  driver_arrived: notificationsCopy.foreground.driverArrived,
  no_driver: notificationsCopy.foreground.noDriver,
};

export function transitionNoticeText(notice: TripTransitionNotice): string {
  return TEXT_BY_NOTICE[notice];
}

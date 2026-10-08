import { useCountdown } from '@voyyaa/ui-mobile';
import type { TripRequestStatus } from '@voyyaa/shared';
import { freeCancellationDeadlineIso } from '../lib/free-cancellation';

export interface FreeCancellation {
  remainingSec: number;
  withinWindow: boolean;
}

export function useFreeCancellation(
  trip: TripRequestStatus | undefined,
  receivedAtMs: number,
): FreeCancellation {
  const deadlineIso = trip
    ? freeCancellationDeadlineIso({
        freeCancellationUntil: trip.free_cancellation_until,
        serverTime: trip.server_time,
        receivedAtMs,
      })
    : null;
  const remainingSec = useCountdown(deadlineIso);
  return { remainingSec, withinWindow: deadlineIso !== null && remainingSec > 0 };
}

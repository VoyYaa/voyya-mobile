import { CompleteTripDTO, TripError, TripTransitionResult } from '@voyyaa/shared';
import { apiRequest } from '@voyyaa/app-runtime';

type TripTransitionAction =
  'en-route' | 'arrived' | 'start' | 'complete' | 'no-show' | 'cash-collected';

function postTripTransition(
  tripRequestId: number,
  action: TripTransitionAction,
  body?: unknown,
): Promise<TripTransitionResult> {
  return apiRequest(
    { method: 'POST', path: `/trips/${tripRequestId}/${action}`, body },
    TripTransitionResult,
    TripError,
  );
}

export function markTripEnRoute(tripRequestId: number): Promise<TripTransitionResult> {
  return postTripTransition(tripRequestId, 'en-route');
}

export function markTripArrived(tripRequestId: number): Promise<TripTransitionResult> {
  return postTripTransition(tripRequestId, 'arrived');
}

export function startTrip(tripRequestId: number): Promise<TripTransitionResult> {
  return postTripTransition(tripRequestId, 'start');
}

export function completeTrip(
  tripRequestId: number,
  dto: CompleteTripDTO,
): Promise<TripTransitionResult> {
  const body = CompleteTripDTO.parse(dto);
  return postTripTransition(tripRequestId, 'complete', body);
}

export function declareNoShow(tripRequestId: number): Promise<TripTransitionResult> {
  return postTripTransition(tripRequestId, 'no-show');
}

export function confirmCashCollected(tripRequestId: number): Promise<TripTransitionResult> {
  return postTripTransition(tripRequestId, 'cash-collected');
}

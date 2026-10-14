import { useTripDraftStore } from './useTripDraftStore';
import { useTripTransitionStore } from './useTripTransitionStore';

export function resetTripSessionState(): void {
  useTripDraftStore.getState().reset();
  useTripTransitionStore.getState().reset();
}

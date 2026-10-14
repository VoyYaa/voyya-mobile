import type { PassengerUiState } from '@voyyaa/shared';

export type TripPhase = 'searching' | 'assigned' | 'en_route' | 'arrived' | 'in_progress' | 'ended';

const PHASE_BY_UI: Partial<Record<PassengerUiState, TripPhase>> = {
  calculating_fare: 'searching',
  searching: 'searching',
  driver_assigned: 'assigned',
  driver_en_route: 'en_route',
  driver_waiting: 'arrived',
  trip_in_progress: 'in_progress',
};

export function tripPhaseOf(trip: { ui: PassengerUiState } | undefined): TripPhase {
  if (trip === undefined) return 'ended';
  return PHASE_BY_UI[trip.ui] ?? 'ended';
}

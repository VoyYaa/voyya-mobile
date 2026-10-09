import type { Coordinate } from '@voyyaa/shared';
import { CAN_PIN_DROP } from '../constants/platform';
import { placesAvailability, type PlacesAvailability } from '../lib/verified-places';
import { usePickupServiceOptions, useServiceOptionsAt } from './useServiceOptions';

export interface PlacesState {
  availability: PlacesAvailability;
  municipalityName: string | null;
}

export function usePickupPlaces(): PlacesState {
  const { query } = usePickupServiceOptions();
  return {
    availability: placesAvailability(query.data),
    municipalityName: query.data?.municipality?.name ?? null,
  };
}

export function usePinPlaces(pin: Coordinate | null): PlacesState {
  const query = useServiceOptionsAt(CAN_PIN_DROP ? pin : null);
  if (!CAN_PIN_DROP || pin === null) return { availability: 'verified', municipalityName: null };
  if (query.data) {
    return {
      availability: placesAvailability(query.data),
      municipalityName: query.data.municipality?.name ?? null,
    };
  }
  return { availability: query.isError ? 'verified' : 'unknown', municipalityName: null };
}

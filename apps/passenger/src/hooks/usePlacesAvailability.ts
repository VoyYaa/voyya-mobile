import type { Coordinate } from '@voyyaa/shared';
import { CAN_PIN_DROP } from '../constants/platform';
import { allVerifiedPlaces, placesFor } from '../constants/verified-places/registry';
import type { VerifiedPlace } from '../constants/verified-places/types';
import { placesAvailability, type PlacesAvailability } from '../lib/verified-places';
import { usePickupServiceOptions, useServiceOptionsAt } from './useServiceOptions';

export interface PlacesState {
  availability: PlacesAvailability;
  municipalityName: string | null;
  places: readonly VerifiedPlace[];
}

const NO_PLACES: readonly VerifiedPlace[] = [];
const ALL_PLACES = allVerifiedPlaces();

function placesOf(municipalityName: string | null): readonly VerifiedPlace[] {
  return placesFor(municipalityName) ?? NO_PLACES;
}

export function usePickupPlaces(): PlacesState {
  const { query } = usePickupServiceOptions();
  const municipalityName = query.data?.municipality?.name ?? null;
  return {
    availability: placesAvailability(query.data),
    municipalityName,
    places: placesOf(municipalityName),
  };
}

export function usePinPlaces(pin: Coordinate | null): PlacesState {
  const query = useServiceOptionsAt(CAN_PIN_DROP ? pin : null);
  const everywhere: PlacesState = {
    availability: 'verified',
    municipalityName: null,
    places: ALL_PLACES,
  };
  if (!CAN_PIN_DROP || pin === null) return everywhere;
  if (query.data) {
    const municipalityName = query.data.municipality?.name ?? null;
    return {
      availability: placesAvailability(query.data),
      municipalityName,
      places: placesOf(municipalityName),
    };
  }
  return query.isError
    ? everywhere
    : { availability: 'unknown', municipalityName: null, places: NO_PLACES };
}

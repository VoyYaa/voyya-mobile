import { useMemo } from 'react';
import type { Coordinate, DemoSession } from '@voyyaa/shared';
import { useDemoSession } from '@voyyaa/app-runtime';
import { CAN_PIN_DROP } from '../constants/platform';
import { allVerifiedPlaces, placesFor } from '../constants/verified-places/registry';
import type { VerifiedPlace } from '../constants/verified-places/types';
import { demoPlacesState } from '../lib/demo-places';
import { placesAvailability, type PlacesState } from '../lib/verified-places';
import { usePickupServiceOptions, useServiceOptionsAt } from './useServiceOptions';

export type { PlacesState };

const NO_PLACES: readonly VerifiedPlace[] = [];
const ALL_PLACES = allVerifiedPlaces();

function useDemoPlaces(demo: DemoSession | null): PlacesState | null {
  return useMemo(() => (demo === null ? null : demoPlacesState(demo)), [demo]);
}

function placesOf(municipalityName: string | null): readonly VerifiedPlace[] {
  return placesFor(municipalityName) ?? NO_PLACES;
}

export function usePickupPlaces(): PlacesState {
  const demoPlaces = useDemoPlaces(useDemoSession());
  const { query } = usePickupServiceOptions();
  if (demoPlaces !== null) return demoPlaces;
  const municipalityName = query.data?.municipality?.name ?? null;
  return {
    availability: placesAvailability(query.data),
    municipalityName,
    places: placesOf(municipalityName),
  };
}

export function usePinPlaces(pin: Coordinate | null): PlacesState {
  const demo = useDemoSession();
  const demoPlaces = useDemoPlaces(demo);
  const query = useServiceOptionsAt(CAN_PIN_DROP && demo === null ? pin : null);
  if (demoPlaces !== null) return demoPlaces;
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

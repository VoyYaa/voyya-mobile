import type { TripServiceMunicipality } from '@voyyaa/shared';
import type { VerifiedPlace } from '../constants/verified-places/types';
import {
  VERIFIED_PLACES_BY_MUNICIPALITY,
  placesFor,
  type PlaceRegistry,
} from '../constants/verified-places/registry';

export type PlacesAvailability = 'verified' | 'elsewhere' | 'unknown';

export interface PlacesState {
  availability: PlacesAvailability;
  municipalityName: string | null;
  places: readonly VerifiedPlace[];
}

interface OptionsWithMunicipality {
  municipality: Pick<TripServiceMunicipality, 'name'> | null;
}

export function placesAvailability(
  options: OptionsWithMunicipality | undefined,
  registry: PlaceRegistry = VERIFIED_PLACES_BY_MUNICIPALITY,
): PlacesAvailability {
  if (options === undefined) return 'unknown';
  if (options.municipality === null) return 'elsewhere';
  return placesFor(options.municipality.name, registry) === null ? 'elsewhere' : 'verified';
}

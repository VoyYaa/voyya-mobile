import type { TripServiceMunicipality } from '@voyyaa/shared';

export const VERIFIED_PLACES_MUNICIPALITY = 'Yarumal';

export type PlacesAvailability = 'verified' | 'elsewhere' | 'unknown';

interface OptionsWithMunicipality {
  municipality: Pick<TripServiceMunicipality, 'name'> | null;
}

function normalizeName(name: string): string {
  return name.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();
}

export function placesAvailability(
  options: OptionsWithMunicipality | undefined,
): PlacesAvailability {
  if (options === undefined) return 'unknown';
  if (options.municipality === null) return 'elsewhere';
  return normalizeName(options.municipality.name) === normalizeName(VERIFIED_PLACES_MUNICIPALITY)
    ? 'verified'
    : 'elsewhere';
}

import type { VerifiedPlace } from './types';
import { YARUMAL_NAME, YARUMAL_PLACES } from './yarumal';

export type PlaceRegistry = Readonly<Record<string, readonly VerifiedPlace[]>>;

export function normalizeMunicipalityName(name: string): string {
  return name.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();
}

export const VERIFIED_PLACES_BY_MUNICIPALITY: PlaceRegistry = {
  [normalizeMunicipalityName(YARUMAL_NAME)]: YARUMAL_PLACES,
};

export function placesFor(
  municipalityName: string | null,
  registry: PlaceRegistry = VERIFIED_PLACES_BY_MUNICIPALITY,
): readonly VerifiedPlace[] | null {
  if (municipalityName === null) return null;
  return registry[normalizeMunicipalityName(municipalityName)] ?? null;
}

export function allVerifiedPlaces(
  registry: PlaceRegistry = VERIFIED_PLACES_BY_MUNICIPALITY,
): readonly VerifiedPlace[] {
  return Object.values(registry).flat();
}

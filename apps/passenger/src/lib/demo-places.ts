import type { DemoPlace, DemoSession } from '@voyyaa/shared';
import type { VerifiedPlace } from '../constants/verified-places/types';
import type { PlacesState } from './verified-places';

export const DEMO_PLACE_ID_PREFIX = 'demo-';

export function demoPlaceToVerifiedPlace(place: DemoPlace): VerifiedPlace {
  return {
    id: `${DEMO_PLACE_ID_PREFIX}${place.key}`,
    title: place.name,
    category: 'general',
    coord: { lat: place.lat, lng: place.lng },
  };
}

export function demoPlacesState(demo: DemoSession): PlacesState {
  const places = demo.places.map(demoPlaceToVerifiedPlace);
  return {
    availability: places.length > 0 ? 'verified' : 'elsewhere',
    municipalityName: demo.municipality_name,
    places,
  };
}

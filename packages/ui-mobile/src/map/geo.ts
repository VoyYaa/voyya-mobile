// =============================================================================
// VoyYa — Conversión MapLatLng ↔ GeoJSON (packages/ui-mobile)
// -----------------------------------------------------------------------------
// Único lugar donde se traduce nuestro `{lat,lng}` al `[lng,lat]` (`Position`)
// que espera Mapbox/GeoJSON. Funciones puras, sin React ni módulo nativo —
// fáciles de testear aparte de NativeMap.
// =============================================================================

import type { Feature, LineString, Position } from 'geojson';
import type { MapLatLng } from './types';

export function toPosition(coord: MapLatLng): Position {
  return [coord.lng, coord.lat];
}

/**
 * `Position` es `[number, number] | number[]`; con `noUncheckedIndexedAccess`
 * (tsconfig.base.json) el acceso indexado a un `number[]` genérico tipa
 * `number | undefined`. Se valida explícitamente en vez de usar `as`/`!`.
 */
export function toLatLng(position: Position): MapLatLng | null {
  const [lng, lat] = position;
  if (typeof lng !== 'number' || typeof lat !== 'number') return null;
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  return { lat, lng };
}

/**
 * Línea recta entre puntos (origen→destino, p.ej.) — ilustrativa, NO una ruta
 * real calculada (no hay integración de Directions API en este build).
 */
export function toRouteFeature(points: readonly MapLatLng[]): Feature<LineString> {
  return {
    type: 'Feature',
    properties: {},
    geometry: { type: 'LineString', coordinates: points.map(toPosition) },
  };
}

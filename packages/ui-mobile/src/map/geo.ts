import type { Feature, LineString, Position } from 'geojson';
import type { MapLatLng } from './types';

export function toPosition(coord: MapLatLng): Position {
  return [coord.lng, coord.lat];
}

export function toLatLng(position: Position): MapLatLng | null {
  const [lng, lat] = position;
  if (typeof lng !== 'number' || typeof lat !== 'number') return null;
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  return { lat, lng };
}

export function toRouteFeature(points: readonly MapLatLng[]): Feature<LineString> {
  return {
    type: 'Feature',
    properties: {},
    geometry: { type: 'LineString', coordinates: points.map(toPosition) },
  };
}

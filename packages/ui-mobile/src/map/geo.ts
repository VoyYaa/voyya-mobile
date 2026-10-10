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

export interface MapBounds {
  ne: Position;
  sw: Position;
}

export function toBounds(points: readonly MapLatLng[]): MapBounds | null {
  const first = points[0];
  if (!first) return null;
  let minLat = first.lat;
  let maxLat = first.lat;
  let minLng = first.lng;
  let maxLng = first.lng;
  for (const point of points) {
    minLat = Math.min(minLat, point.lat);
    maxLat = Math.max(maxLat, point.lat);
    minLng = Math.min(minLng, point.lng);
    maxLng = Math.max(maxLng, point.lng);
  }
  return { ne: [maxLng, maxLat], sw: [minLng, minLat] };
}

export function toRouteFeature(points: readonly MapLatLng[]): Feature<LineString> {
  return {
    type: 'Feature',
    properties: {},
    geometry: { type: 'LineString', coordinates: points.map(toPosition) },
  };
}

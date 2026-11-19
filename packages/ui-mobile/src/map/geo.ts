import type { Feature, LineString, Position } from 'geojson';
import type { MapLatLng, MapRoute } from './types';

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

const EARTH_RADIUS_M = 6371000;
const STRAIGHT_LINE_MAX_M = 40;
export const CURVE_BEND = 0.18;
export const CURVE_SEGMENTS = 24;
export const REFIT_MOVE_THRESHOLD_M = 25;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function distanceMeters(a: MapLatLng, b: MapLatLng): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a.lat)) * Math.cos(toRadians(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export interface CurveOptions {
  bend?: number;
  segments?: number;
}

function isCanonicalOrder(a: MapLatLng, b: MapLatLng): boolean {
  return a.lng < b.lng || (a.lng === b.lng && a.lat <= b.lat);
}

function curveFromCanonical(
  a: MapLatLng,
  b: MapLatLng,
  bend: number,
  segments: number,
): MapLatLng[] {
  const lngScale = Math.cos(toRadians((a.lat + b.lat) / 2));
  const dx = (b.lng - a.lng) * lngScale;
  const dy = b.lat - a.lat;
  const control = {
    x: ((a.lng + b.lng) / 2) * lngScale + dy * bend,
    y: (a.lat + b.lat) / 2 - dx * bend,
  };
  const start = { x: a.lng * lngScale, y: a.lat };
  const end = { x: b.lng * lngScale, y: b.lat };
  const points: MapLatLng[] = [a];
  for (let step = 1; step < segments; step += 1) {
    const t = step / segments;
    const u = 1 - t;
    const x = u * u * start.x + 2 * u * t * control.x + t * t * end.x;
    const y = u * u * start.y + 2 * u * t * control.y + t * t * end.y;
    points.push({ lat: y, lng: x / lngScale });
  }
  points.push(b);
  return points;
}

export function toCurvedRoute(
  a: MapLatLng,
  b: MapLatLng,
  { bend = CURVE_BEND, segments = CURVE_SEGMENTS }: CurveOptions = {},
): MapLatLng[] {
  if (distanceMeters(a, b) < STRAIGHT_LINE_MAX_M) return [a, b];
  if (isCanonicalOrder(a, b)) return curveFromCanonical(a, b, bend, segments);
  return curveFromCanonical(b, a, bend, segments).reverse();
}

export function routeMidpoint(points: readonly MapLatLng[]): MapLatLng | null {
  const first = points[0];
  const last = points[points.length - 1];
  if (!first || !last) return null;
  if (points.length === 2) {
    return { lat: (first.lat + last.lat) / 2, lng: (first.lng + last.lng) / 2 };
  }
  return points[Math.floor(points.length / 2)] ?? null;
}

export function isCollapsedBounds(bounds: MapBounds): boolean {
  return bounds.ne[0] === bounds.sw[0] && bounds.ne[1] === bounds.sw[1];
}

export function haveMarkersMoved(
  previous: readonly MapLatLng[],
  next: readonly MapLatLng[],
  thresholdMeters = REFIT_MOVE_THRESHOLD_M,
): boolean {
  if (previous.length !== next.length) return true;
  return next.some((point, index) => {
    const before = previous[index];
    return !before || distanceMeters(before, point) > thresholdMeters;
  });
}

export interface ResolvedRoute {
  points: readonly MapLatLng[];
  approximate: boolean;
}

export function resolveRoute(route: MapRoute): ResolvedRoute | null {
  const [from, to] = route.points;
  if (!from || !to) return null;
  if (route.points.length > 2) return { points: route.points, approximate: false };
  const approximate = route.approximate !== false;
  return { points: approximate ? toCurvedRoute(from, to) : route.points, approximate };
}

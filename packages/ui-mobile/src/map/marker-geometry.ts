import { distanceMeters } from './geo';
import { mapCopy } from '../copy';
import type { MapLatLng, MapMarker, MapMarkerKind } from './types';

export const MARKER_HEIGHT: Record<MapMarkerKind, number> = {
  origin: 48,
  destination: 56,
  car: 58,
};

export const MARKER_ANCHOR_Y: Record<MapMarkerKind, number> = {
  origin: 24,
  destination: 54,
  car: 29,
};

export const LABEL_HEIGHT = 24;
export const LABEL_GAP = 2;
export const LABEL_MIN_MAP_HEIGHT = 140;
export const LABEL_WIDTH_ESTIMATE = 96;
export const LABEL_BAND_DP = LABEL_HEIGHT + LABEL_GAP + 2;

const MAP_TILE_METERS_PER_DP_AT_ZOOM_0 = 78271.517;

const LABEL_PRIORITY: Record<MapMarkerKind, number> = { car: 0, destination: 1, origin: 2 };

const KIND_LABEL: Record<MapMarkerKind, string> = {
  origin: mapCopy.markerOrigin,
  destination: mapCopy.markerDestination,
  car: mapCopy.markerDriver,
};

export function markerAnchorY(kind: MapMarkerKind, hasLabel: boolean): number {
  const total = MARKER_HEIGHT[kind] + (hasLabel ? LABEL_GAP + LABEL_HEIGHT : 0);
  return MARKER_ANCHOR_Y[kind] / total;
}

export function markerLabelText(marker: MapMarker): string {
  if (marker.kind === 'car' && marker.freshness === 'stale' && marker.ageLabel) {
    return marker.ageLabel;
  }
  return KIND_LABEL[marker.kind];
}

export interface Viewport {
  width: number;
  height: number;
}

export interface FitInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export function uniformInsets(value: number): FitInsets {
  return { top: value, right: value, bottom: value, left: value };
}

export function metersPerDp(lat: number, zoom: number): number {
  return (MAP_TILE_METERS_PER_DP_AT_ZOOM_0 * Math.cos((lat * Math.PI) / 180)) / 2 ** zoom;
}

export function estimateFitZoom(
  points: readonly MapLatLng[],
  viewport: Viewport,
  insets: FitInsets,
  range: { min: number; max: number },
): number {
  const first = points[0];
  if (!first) return range.max;
  let north = first;
  let south = first;
  let east = first;
  let west = first;
  for (const point of points) {
    if (point.lat > north.lat) north = point;
    if (point.lat < south.lat) south = point;
    if (point.lng > east.lng) east = point;
    if (point.lng < west.lng) west = point;
  }
  const midLat = (north.lat + south.lat) / 2;
  const spanY = distanceMeters(
    { lat: north.lat, lng: first.lng },
    { lat: south.lat, lng: first.lng },
  );
  const spanX = distanceMeters({ lat: midLat, lng: west.lng }, { lat: midLat, lng: east.lng });
  const availableWidth = Math.max(1, viewport.width - insets.left - insets.right);
  const availableHeight = Math.max(1, viewport.height - insets.top - insets.bottom);
  const metersPerPixel = Math.max(spanX / availableWidth, spanY / availableHeight);
  if (metersPerPixel <= 0) return range.max;
  const zoom = Math.log2(
    (MAP_TILE_METERS_PER_DP_AT_ZOOM_0 * Math.cos((midLat * Math.PI) / 180)) / metersPerPixel,
  );
  return Math.min(range.max, Math.max(range.min, zoom));
}

export interface LabelContext {
  viewport: Viewport;
  zoom: number;
}

function offsetDp(from: MapLatLng, to: MapLatLng, zoom: number): { dx: number; dy: number } {
  const perDp = metersPerDp(from.lat, zoom);
  const dx =
    distanceMeters({ lat: from.lat, lng: from.lng }, { lat: from.lat, lng: to.lng }) / perDp;
  const dy =
    distanceMeters({ lat: from.lat, lng: from.lng }, { lat: to.lat, lng: from.lng }) / perDp;
  return { dx, dy };
}

export function selectLabeledMarkerIds(
  markers: readonly MapMarker[],
  { viewport, zoom }: LabelContext,
): ReadonlySet<string> {
  if (viewport.height < LABEL_MIN_MAP_HEIGHT) return new Set();
  const ordered = markers
    .filter((marker) => marker.showLabel !== false)
    .sort((a, b) => LABEL_PRIORITY[a.kind] - LABEL_PRIORITY[b.kind]);
  const accepted: MapMarker[] = [];
  for (const marker of ordered) {
    const overlaps = accepted.some((other) => {
      const { dx, dy } = offsetDp(other.coord, marker.coord, zoom);
      return dx < LABEL_WIDTH_ESTIMATE && dy < LABEL_BAND_DP + 16;
    });
    if (!overlaps) accepted.push(marker);
  }
  return new Set(accepted.map((marker) => marker.id));
}

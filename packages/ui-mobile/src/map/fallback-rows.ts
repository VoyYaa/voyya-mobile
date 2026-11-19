import { mapCopy } from '../copy';
import type { MapMarker, MapMarkerKind } from './types';

const ROW_PREFIX: Record<MapMarkerKind, string> = {
  origin: mapCopy.fallbackOrigin,
  destination: mapCopy.fallbackDestination,
  car: mapCopy.fallbackDriver,
};

export interface FallbackRow {
  id: string;
  text: string;
}

export function fallbackRows(markers: readonly MapMarker[] | undefined): FallbackRow[] {
  const rows: FallbackRow[] = [];
  for (const marker of markers ?? []) {
    const label = marker.label?.trim();
    if (label) rows.push({ id: marker.id, text: `${ROW_PREFIX[marker.kind]}: ${label}` });
  }
  return rows;
}

export function hasRouteSchematic(markers: readonly MapMarker[] | undefined): boolean {
  const kinds = new Set((markers ?? []).map((marker) => marker.kind));
  return kinds.has('origin') && kinds.has('destination');
}

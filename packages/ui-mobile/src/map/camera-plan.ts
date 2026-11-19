import { haveMarkersMoved, isCollapsedBounds, toBounds, type MapBounds } from './geo';
import {
  LABEL_BAND_DP,
  estimateFitZoom,
  labeledFitInsets,
  selectLabeledMarkerIds,
  uniformInsets,
  type FitInsets,
  type Viewport,
} from './marker-geometry';
import type { MapLatLng, MapMarker } from './types';

export const DEFAULT_FIT_INSET_DP = 48;
export const DEFAULT_FIT_ZOOM_RANGE = { min: 12, max: 16 } as const;
export const DEFAULT_ZOOM = 15;

export interface CameraPlanInput {
  markers: readonly MapMarker[];
  center: MapLatLng;
  zoomLevel: number;
  pinDrop: boolean;
  fitToMarkers?: boolean;
  fitInsets?: FitInsets;
  fitZoomRange?: { min: number; max: number };
  viewport: Viewport;
}

export type CameraPlan =
  | { kind: 'center'; center: MapLatLng; zoom: number; labeledIds: ReadonlySet<string> }
  | {
      kind: 'bounds';
      bounds: MapBounds;
      insets: FitInsets;
      zoomRange: { min: number; max: number };
      zoom: number;
      labeledIds: ReadonlySet<string>;
    };

export function shouldFit(
  input: Pick<CameraPlanInput, 'markers' | 'pinDrop' | 'fitToMarkers'>,
): boolean {
  if (input.markers.length < 2) return false;
  return input.fitToMarkers ?? !input.pinDrop;
}

function labeledInsets(
  input: CameraPlanInput,
  insets: FitInsets,
  labeledIds: ReadonlySet<string>,
): FitInsets {
  if (labeledIds.size === 0) return insets;
  if (input.fitInsets) return { ...insets, bottom: insets.bottom + LABEL_BAND_DP };
  return labeledFitInsets(input.markers.filter((marker) => labeledIds.has(marker.id)));
}

export function planCamera(input: CameraPlanInput): CameraPlan {
  const insets = input.fitInsets ?? uniformInsets(DEFAULT_FIT_INSET_DP);
  const range = input.fitZoomRange ?? DEFAULT_FIT_ZOOM_RANGE;
  const points = input.markers.map((marker) => marker.coord);
  const bounds = shouldFit(input) ? toBounds(points) : null;

  if (!bounds || isCollapsedBounds(bounds)) {
    const target = bounds ? (points[0] ?? input.center) : input.center;
    const labeledIds = selectLabeledMarkerIds(input.markers, {
      viewport: input.viewport,
      zoom: input.zoomLevel,
    });
    return { kind: 'center', center: target, zoom: input.zoomLevel, labeledIds };
  }

  const baseZoom = estimateFitZoom(points, input.viewport, insets, range);
  const labeledIds = selectLabeledMarkerIds(input.markers, {
    viewport: input.viewport,
    zoom: baseZoom,
  });
  return {
    kind: 'bounds',
    bounds,
    insets: labeledInsets(input, insets, labeledIds),
    zoomRange: range,
    zoom: baseZoom,
    labeledIds,
  };
}

export function fitMarkersChanged(
  previous: readonly MapMarker[],
  next: readonly MapMarker[],
): boolean {
  const sameIds =
    previous.length === next.length &&
    previous.every((marker, index) => marker.id === next[index]?.id);
  if (!sameIds) return true;
  return haveMarkersMoved(
    previous.map((marker) => marker.coord),
    next.map((marker) => marker.coord),
  );
}

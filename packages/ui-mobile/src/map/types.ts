import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

export interface MapLatLng {
  lat: number;
  lng: number;
}

export type MapMarkerKind = 'origin' | 'destination' | 'car';

export type MapPinKind = 'origin' | 'destination';

export type MapMarkerFreshness = 'live' | 'stale';

export interface MapMarker {
  id: string;
  kind: MapMarkerKind;
  coord: MapLatLng;
  label?: string;
  freshness?: MapMarkerFreshness;
  ageLabel?: string;
  showLabel?: boolean;
}

export interface MapRoute {
  points: readonly MapLatLng[];
  approximate?: boolean;
}

export interface MapFitInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface MapProps {
  center: MapLatLng;
  zoomLevel?: number;
  markers?: readonly MapMarker[];
  route?: MapRoute;
  pinDrop?: boolean;
  onPickLocation?: (coord: MapLatLng) => void;
  interactive?: boolean;
  fitToMarkers?: boolean;
  fitPadding?: number;
  fitZoomRange?: { min: number; max: number };
  fitInsets?: MapFitInsets;
  pinKind?: MapPinKind;
  myLocation?: MapLatLng | null;
  coveredBottom?: number;
  expandable?: boolean;
  expandedTitle?: string;
  expandedSummary?: ReactNode;
  fallback?: ReactNode;
  height?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

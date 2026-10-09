import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

export interface MapLatLng {
  lat: number;
  lng: number;
}

export type MapMarkerKind = 'origin' | 'destination' | 'car';

export type MapMarkerFreshness = 'live' | 'stale';

export interface MapMarker {
  id: string;
  kind: MapMarkerKind;
  coord: MapLatLng;
  label?: string;
  freshness?: MapMarkerFreshness;
}

export interface MapRoute {
  points: readonly MapLatLng[];
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
  fallback?: ReactNode;
  height?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

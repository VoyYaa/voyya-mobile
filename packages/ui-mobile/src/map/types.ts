import type { StyleProp, ViewStyle } from 'react-native';

export interface MapLatLng {
  lat: number;
  lng: number;
}

export type MapMarkerKind = 'origin' | 'destination' | 'car';

export interface MapMarker {
  id: string;
  kind: MapMarkerKind;
  coord: MapLatLng;
  label?: string;
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
  height?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

import React from 'react';
import { Platform } from 'react-native';
import { getMapboxAccessToken, isNativeMapAvailable } from '../map/mapbox-env';
import { MapErrorBoundary } from '../map/MapErrorBoundary';
import { MAP_WEB_UNAVAILABLE_LABEL, MapFallback } from '../map/MapFallback';
import { NativeMap } from '../map/NativeMap';
import type { MapProps } from '../map/types';

export type {
  MapLatLng,
  MapMarker,
  MapMarkerFreshness,
  MapMarkerKind,
  MapProps,
  MapRoute,
} from '../map/types';

export function Map(props: MapProps): React.JSX.Element {
  if (Platform.OS === 'web') {
    if (props.fallback) return <>{props.fallback}</>;
    return (
      <MapFallback
        label={MAP_WEB_UNAVAILABLE_LABEL}
        markers={props.markers}
        height={props.height}
        style={props.style}
        testID={props.testID}
      />
    );
  }

  const token = getMapboxAccessToken();

  const fallback = props.fallback ?? (
    <MapFallback height={props.height} style={props.style} testID={props.testID} />
  );

  if (!token || !isNativeMapAvailable()) return <>{fallback}</>;

  return (
    <MapErrorBoundary fallback={fallback}>
      <NativeMap {...props} accessToken={token} />
    </MapErrorBoundary>
  );
}

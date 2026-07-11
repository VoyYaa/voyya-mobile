import React from 'react';
import { getMapboxAccessToken, isNativeMapAvailable } from '../map/mapbox-env';
import { MapErrorBoundary } from '../map/MapErrorBoundary';
import { MapFallback } from '../map/MapFallback';
import { NativeMap } from '../map/NativeMap';
import type { MapProps } from '../map/types';

export type { MapLatLng, MapMarker, MapMarkerKind, MapProps, MapRoute } from '../map/types';

export function Map(props: MapProps): React.JSX.Element {
  const token = getMapboxAccessToken();

  if (!token || !isNativeMapAvailable()) {
    return <MapFallback height={props.height} style={props.style} testID={props.testID} />;
  }

  return (
    <MapErrorBoundary
      fallback={<MapFallback height={props.height} style={props.style} testID={props.testID} />}
    >
      <NativeMap {...props} accessToken={token} />
    </MapErrorBoundary>
  );
}

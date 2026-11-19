import React from 'react';
import { LineLayer, MarkerView, ShapeSource } from '@rnmapbox/maps';
import { useTheme } from '../theme';
import { routeMidpoint, toPosition, toRouteFeature } from './geo';
import { mapCopy } from '../copy';
import { MapMarkerLabel } from './MapMarkerLabel';
import type { MapLatLng } from './types';

export const ROUTE_CASING_WIDTH = 7;
export const ROUTE_FILL_WIDTH = 4;
const APPROXIMATE_DASH = [1.5, 2];
const CASING_DASH = APPROXIMATE_DASH.map((part) => (part * ROUTE_FILL_WIDTH) / ROUTE_CASING_WIDTH);

export interface RouteLayerProps {
  points: readonly MapLatLng[];
  approximate: boolean;
}

export function RouteLayer({ points, approximate }: RouteLayerProps): React.JSX.Element {
  const { colors } = useTheme();
  const fillDash = approximate ? { lineDasharray: APPROXIMATE_DASH } : {};
  const casingDash = approximate ? { lineDasharray: CASING_DASH } : {};
  return (
    <ShapeSource id="voyya-route-source" shape={toRouteFeature(points)}>
      <LineLayer
        id="voyya-route-casing"
        style={{
          lineColor: colors.mapRouteCasing,
          lineWidth: ROUTE_CASING_WIDTH,
          lineCap: 'round',
          lineJoin: 'round',
          ...casingDash,
        }}
      />
      <LineLayer
        id="voyya-route-line"
        aboveLayerID="voyya-route-casing"
        style={{
          lineColor: colors.mapRoute,
          lineWidth: ROUTE_FILL_WIDTH,
          lineCap: 'round',
          lineJoin: 'round',
          ...fillDash,
        }}
      />
    </ShapeSource>
  );
}

export interface RouteLabelProps {
  points: readonly MapLatLng[];
}

export function RouteLabel({ points }: RouteLabelProps): React.JSX.Element | null {
  const middle = routeMidpoint(points);
  if (!middle) return null;
  return (
    <MarkerView coordinate={toPosition(middle)} anchor={{ x: 0.5, y: 0.5 }} allowOverlap>
      <MapMarkerLabel text={mapCopy.routeApproximate} />
    </MarkerView>
  );
}

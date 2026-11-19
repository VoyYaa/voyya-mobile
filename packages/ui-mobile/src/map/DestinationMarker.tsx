import React from 'react';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import { BRAND_COLORS } from '../tokens';

export const DESTINATION_MARKER_WIDTH = 48;
export const DESTINATION_MARKER_HEIGHT = 56;

export interface DestinationMarkerProps {
  withShadow?: boolean;
}

export function DestinationMarker({
  withShadow = true,
}: DestinationMarkerProps): React.JSX.Element {
  return (
    <Svg
      width={DESTINATION_MARKER_WIDTH}
      height={DESTINATION_MARKER_HEIGHT}
      viewBox="0 0 48 56"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {withShadow && (
        <Ellipse cx={24} cy={52} rx={9} ry={2.6} fill={BRAND_COLORS.espresso} fillOpacity={0.18} />
      )}
      <Path
        d="M24 3 a17 17 0 0 1 17 17 c0 14.5 -17 34 -17 34 s-17 -19.5 -17 -34 a17 17 0 0 1 17 -17 Z"
        fill={BRAND_COLORS.espresso}
        stroke={BRAND_COLORS.crema}
        strokeWidth={2.5}
      />
      <Circle cx={24} cy={20} r={6.5} fill={BRAND_COLORS.crema} />
    </Svg>
  );
}

import React from 'react';
import Svg, { Circle } from 'react-native-svg';
import { BRAND_COLORS } from '../tokens';
import { useTheme } from '../theme';

export const ORIGIN_MARKER_SIZE = 48;

export function OriginMarker(): React.JSX.Element {
  const { colors } = useTheme();
  return (
    <Svg
      width={ORIGIN_MARKER_SIZE}
      height={ORIGIN_MARKER_SIZE}
      viewBox="0 0 48 48"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Circle
        cx={24}
        cy={24}
        r={22}
        fill="#FFFFFF"
        stroke={colors.mapMarkerRing}
        strokeOpacity={0.18}
        strokeWidth={1}
      />
      <Circle cx={24} cy={24} r={14} fill="none" stroke={colors.mapMarkerRing} strokeWidth={3} />
      <Circle cx={24} cy={24} r={8.5} fill={BRAND_COLORS.amber} />
    </Svg>
  );
}

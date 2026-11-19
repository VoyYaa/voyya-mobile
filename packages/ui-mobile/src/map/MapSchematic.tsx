import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTheme } from '../theme';

export interface MapSchematicProps {
  withRoute: boolean;
  width?: number;
}

const VIEW_WIDTH = 120;
const VIEW_HEIGHT = 56;

export function MapSchematic({
  withRoute,
  width = VIEW_WIDTH,
}: MapSchematicProps): React.JSX.Element {
  const { colors } = useTheme();
  const height = (width * VIEW_HEIGHT) / VIEW_WIDTH;

  return (
    <Svg
      width={width}
      height={height}
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {withRoute && (
        <Path
          d="M22 38 Q60 6 98 22"
          fill="none"
          stroke={colors.borderStrong}
          strokeWidth={2.5}
          strokeDasharray="4 5"
          strokeLinecap="round"
        />
      )}
      <Circle
        cx={22}
        cy={38}
        r={9}
        fill="#FFFFFF"
        stroke={colors.mapMarkerRing}
        strokeWidth={2.5}
      />
      <Circle cx={22} cy={38} r={4} fill={colors.brand} />
      {withRoute && (
        <>
          <Path
            d="M98 6 a9 9 0 0 1 9 9 c0 8 -9 19 -9 19 s-9 -11 -9 -19 a9 9 0 0 1 9 -9 Z"
            fill={colors.text}
          />
          <Circle cx={98} cy={15} r={3.4} fill={colors.bg} />
        </>
      )}
    </Svg>
  );
}

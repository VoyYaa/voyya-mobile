import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export interface TaxiMarkProps {
  color: string;
  cutout: string;
  size?: number;
  testID?: string;
}

const DEFAULT_SIZE = 24;

export function TaxiMark({
  color,
  cutout,
  size = DEFAULT_SIZE,
  testID,
}: TaxiMarkProps): React.JSX.Element {
  return (
    <Svg
      testID={testID}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Rect x={9.5} y={3.6} width={5} height={2.6} rx={1} fill={color} />
      <Path
        d="M2.8 15.4 L4.4 10.6 C4.8 9.4 5.8 8.6 7 8.6 H17 C18.2 8.6 19.2 9.4 19.6 10.6 L21.2 15.4 V18.4 H2.8 Z"
        fill={color}
      />
      <Path
        d="M6.6 10.5 H11.4 V13.2 H5.7 Z M12.6 10.5 H17.4 L18.3 13.2 H12.6 Z"
        fill={cutout}
        fillOpacity={0.9}
      />
      <Circle cx={7.2} cy={18.6} r={2.3} fill={color} stroke={cutout} strokeWidth={1.2} />
      <Circle cx={16.8} cy={18.6} r={2.3} fill={color} stroke={cutout} strokeWidth={1.2} />
    </Svg>
  );
}

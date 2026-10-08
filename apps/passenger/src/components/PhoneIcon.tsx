import React from 'react';
import Svg, { Path } from 'react-native-svg';

export interface PhoneIconProps {
  color: string;
  size?: number;
}

const DEFAULT_SIZE = 20;

export function PhoneIcon({ color, size = DEFAULT_SIZE }: PhoneIconProps): React.JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6.6 3.5 H9.4 L10.9 7.6 L8.9 9 C9.9 11.1 11.9 13.1 14 14.1 L15.4 12.1 L19.5 13.6 V16.4 C19.5 17.6 18.5 18.5 17.4 18.5 C10.5 18.1 5.9 13.5 5.5 6.6 C5.5 5.5 6 3.5 6.6 3.5 Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

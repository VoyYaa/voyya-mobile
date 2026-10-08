import React from 'react';
import { MAP_WEB_UNAVAILABLE_LABEL, MapFallback } from './MapFallback';
import type { MapProps } from './types';

export interface NativeMapProps extends MapProps {
  accessToken: string;
}

export function NativeMap({ height, style, testID, markers }: NativeMapProps): React.JSX.Element {
  return (
    <MapFallback
      label={MAP_WEB_UNAVAILABLE_LABEL}
      markers={markers}
      height={height}
      style={style}
      testID={testID}
    />
  );
}

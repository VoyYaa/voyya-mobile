import React from 'react';
import { MapFallback } from './MapFallback';
import type { MapProps } from './types';

export interface NativeMapProps extends MapProps {
  accessToken: string;
}

export function NativeMap({ height, style, testID }: NativeMapProps): React.JSX.Element {
  return <MapFallback height={height} style={style} testID={testID} />;
}

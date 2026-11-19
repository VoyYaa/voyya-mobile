import React from 'react';
import { View } from 'react-native';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { BRAND_COLORS } from '../tokens';
import {
  DESTINATION_MARKER_HEIGHT,
  DESTINATION_MARKER_WIDTH,
  DestinationMarker,
} from './DestinationMarker';
import { ORIGIN_MARKER_SIZE, OriginMarker } from './OriginMarker';

export type PinDropKind = 'origin' | 'destination';

export const PIN_LIFT_DP = 8;

export interface PinDropMarkerProps {
  kind: PinDropKind;
  lifted: boolean;
}

const GROUND_SHADOW_WIDTH = 18;
const GROUND_SHADOW_HEIGHT = 5;
const DESTINATION_TIP_Y = 54;

export function pinDropAnchor(kind: PinDropKind): { x: number; y: number } {
  return kind === 'origin'
    ? { x: ORIGIN_MARKER_SIZE / 2, y: ORIGIN_MARKER_SIZE / 2 }
    : { x: DESTINATION_MARKER_WIDTH / 2, y: DESTINATION_TIP_Y };
}

export function PinDropMarker({ kind, lifted }: PinDropMarkerProps): React.JSX.Element {
  const reduced = useReducedMotion();
  const anchor = pinDropAnchor(kind);
  const width = kind === 'origin' ? ORIGIN_MARKER_SIZE : DESTINATION_MARKER_WIDTH;
  const height = kind === 'origin' ? ORIGIN_MARKER_SIZE : DESTINATION_MARKER_HEIGHT;
  const translateY = lifted && !reduced ? -PIN_LIFT_DP : 0;

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        marginLeft: -anchor.x,
        marginTop: -anchor.y,
        width,
        height,
      }}
    >
      <View
        style={{
          position: 'absolute',
          left: (width - GROUND_SHADOW_WIDTH) / 2,
          top: anchor.y - GROUND_SHADOW_HEIGHT / 2,
          width: GROUND_SHADOW_WIDTH,
          height: GROUND_SHADOW_HEIGHT,
          borderRadius: GROUND_SHADOW_HEIGHT,
          backgroundColor: BRAND_COLORS.espresso,
          opacity: lifted ? 0.28 : 0.14,
        }}
      />
      <View style={{ transform: [{ translateY }] }}>
        {kind === 'origin' ? <OriginMarker /> : <DestinationMarker withShadow={false} />}
      </View>
    </View>
  );
}

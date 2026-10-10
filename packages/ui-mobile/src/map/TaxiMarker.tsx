import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../theme';
import { MarkGlyph } from '../components/brand/MarkGlyph';
import type { MapMarkerFreshness } from './types';
import { TaxiMark } from './TaxiMark';

export interface TaxiMarkerProps {
  freshness: MapMarkerFreshness;
}

export const TAXI_MARKER_SIZE = 40;
const OUTER_RING = 1;
const INNER_RING = 3;
const HALO_SIZE = 58;
const BADGE_SIZE = 18;
const FROZEN_OPACITY = 0.7;
const HALO_OPACITY = 0.25;
const ICON_SIZE = 20;
const CLOCK_SIZE = 14;

export function TaxiMarker({ freshness }: TaxiMarkerProps): React.JSX.Element {
  const { colors } = useTheme();
  const frozen = freshness === 'stale';
  const container = HALO_SIZE;

  return (
    <View
      style={{
        width: container,
        height: container,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {!frozen && (
        <View
          style={{
            position: 'absolute',
            width: HALO_SIZE,
            height: HALO_SIZE,
            borderRadius: HALO_SIZE / 2,
            backgroundColor: colors.brand,
            opacity: HALO_OPACITY,
          }}
        />
      )}
      <View
        style={{
          width: TAXI_MARKER_SIZE + OUTER_RING * 2,
          height: TAXI_MARKER_SIZE + OUTER_RING * 2,
          borderRadius: (TAXI_MARKER_SIZE + OUTER_RING * 2) / 2,
          borderWidth: OUTER_RING,
          borderColor: colors.onStage,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: frozen ? FROZEN_OPACITY : 1,
        }}
      >
        <View
          style={{
            width: TAXI_MARKER_SIZE,
            height: TAXI_MARKER_SIZE,
            borderRadius: TAXI_MARKER_SIZE / 2,
            backgroundColor: colors.stage,
            borderWidth: INNER_RING,
            borderColor: colors.brand,
            borderStyle: frozen ? 'dashed' : 'solid',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <TaxiMark color={colors.onStage} cutout={colors.stage} size={ICON_SIZE} />
        </View>
      </View>
      {frozen && (
        <View
          style={{
            position: 'absolute',
            top: 2,
            right: 2,
            width: BADGE_SIZE,
            height: BADGE_SIZE,
            borderRadius: BADGE_SIZE / 2,
            backgroundColor: colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MarkGlyph glyph="clock" size={CLOCK_SIZE} color={colors.textMuted} />
        </View>
      )}
    </View>
  );
}

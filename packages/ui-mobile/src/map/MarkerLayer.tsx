import React from 'react';
import { MarkerView } from '@rnmapbox/maps';
import { toPosition } from './geo';
import { markerAnchorY } from './marker-geometry';
import { MapMarkerBody } from './MapMarkerBody';
import type { MapMarker } from './types';

export interface MarkerLayerProps {
  markers: readonly MapMarker[];
  labeledIds: ReadonlySet<string>;
}

export function MarkerLayer({ markers, labeledIds }: MarkerLayerProps): React.JSX.Element {
  return (
    <>
      {markers.map((marker) => {
        const labeled = labeledIds.has(marker.id);
        return (
          <MarkerView
            key={`${marker.id}-${marker.freshness ?? 'live'}-${labeled ? 'l' : 'n'}`}
            coordinate={toPosition(marker.coord)}
            anchor={{ x: 0.5, y: markerAnchorY(marker.kind, labeled) }}
            allowOverlap
          >
            <MapMarkerBody marker={marker} labeled={labeled} />
          </MarkerView>
        );
      })}
    </>
  );
}

import React from 'react';
import { View } from 'react-native';
import { DestinationMarker } from './DestinationMarker';
import { LABEL_GAP, markerLabelText } from './marker-geometry';
import { MapMarkerLabel } from './MapMarkerLabel';
import { OriginMarker } from './OriginMarker';
import { TaxiMarker } from './TaxiMarker';
import type { MapMarker } from './types';

export interface MapMarkerBodyProps {
  marker: MapMarker;
  labeled: boolean;
}

function MarkerGraphic({ marker }: { marker: MapMarker }): React.JSX.Element {
  if (marker.kind === 'car') return <TaxiMarker freshness={marker.freshness ?? 'live'} />;
  if (marker.kind === 'destination') return <DestinationMarker />;
  return <OriginMarker />;
}

export function MapMarkerBody({ marker, labeled }: MapMarkerBodyProps): React.JSX.Element {
  return (
    <View style={{ alignItems: 'center' }}>
      <MarkerGraphic marker={marker} />
      {labeled && (
        <View style={{ marginTop: LABEL_GAP }}>
          <MapMarkerLabel text={markerLabelText(marker)} />
        </View>
      )}
    </View>
  );
}

import React from 'react';
import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../theme';
import type { MapMarker, MapMarkerKind } from './types';

export const MAP_WEB_UNAVAILABLE_LABEL = 'Mapa no disponible en la versi�n web de desarrollo';

const MARKER_KIND_LABELS: Record<MapMarkerKind, string> = {
  origin: 'Origen',
  destination: 'Destino',
  car: 'Taxi',
};

function describeMarker(marker: MapMarker): string {
  const kind = MARKER_KIND_LABELS[marker.kind];
  const name = marker.label ? ` ${marker.label}` : '';
  return `${kind}${name}: ${marker.coord.lat.toFixed(5)}, ${marker.coord.lng.toFixed(5)}`;
}

export interface MapFallbackProps {
  label?: string;
  markers?: readonly MapMarker[];
  height?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function MapFallback({
  label,
  markers,
  height = 200,
  style,
  testID,
}: MapFallbackProps): React.JSX.Element {
  const theme = useTheme();

  return (
    <View
      testID={testID}
      accessibilityElementsHidden={!markers?.length}
      importantForAccessibility={markers?.length ? 'auto' : 'no-hide-descendants'}
      style={[
        {
          height,
          borderRadius: theme.radius.card,
          backgroundColor: theme.colors.surfaceAlt,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: theme.colors.border,
        },
        style,
      ]}
    >
      <Text style={{ ...theme.typography.small, color: theme.colors.textMuted }}>
        {label ?? 'Mapa no disponible'}
      </Text>
      {markers?.map((marker) => (
        <Text
          key={marker.id}
          style={{ ...theme.typography.small, color: theme.colors.text, marginTop: 4 }}
        >
          {describeMarker(marker)}
        </Text>
      ))}
    </View>
  );
}

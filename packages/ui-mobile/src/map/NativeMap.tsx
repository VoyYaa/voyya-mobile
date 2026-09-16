import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Mapbox, {
  Camera,
  LineLayer,
  MapView,
  PointAnnotation,
  ShapeSource,
  type MapState,
} from '@rnmapbox/maps';
import type { Feature } from 'geojson';
import { useTheme } from '../theme';
import { toLatLng, toPosition, toRouteFeature } from './geo';
import type { MapLatLng, MapMarkerKind, MapProps } from './types';

let tokenAppliedTo: string | null = null;

function ensureAccessToken(token: string): void {
  if (tokenAppliedTo === token) return;
  tokenAppliedTo = token;
  void Mapbox.setAccessToken(token);
}

const GLYPH_BY_KIND: Record<MapMarkerKind, string> = {
  origin: '●',
  destination: '▼',
  car: '🚗',
};

export interface NativeMapProps extends MapProps {
  accessToken: string;
}

export function NativeMap({
  accessToken,
  center,
  zoomLevel = 15,
  markers = [],
  route,
  pinDrop = false,
  onPickLocation,
  interactive = true,
  height = 200,
  style,
  testID,
}: NativeMapProps): React.JSX.Element {
  const theme = useTheme();
  const [focusedCenter, setFocusedCenter] = useState<MapLatLng>(center);

  useEffect(() => {
    ensureAccessToken(accessToken);
  }, [accessToken]);

  useEffect(() => {
    setFocusedCenter(center);
  }, [center.lat, center.lng]);

  function colorForKind(kind: MapMarkerKind): string {
    if (kind === 'destination') return theme.colors.brandInk;
    if (kind === 'car') return theme.colors.success;
    return theme.colors.text;
  }

  function reportPickedLocation(next: MapLatLng | null): void {
    if (!pinDrop || !onPickLocation || !next) return;
    setFocusedCenter(next);
    onPickLocation(next);
  }

  function handlePress(feature: Feature): void {
    if (!feature.geometry || feature.geometry.type !== 'Point') return;
    reportPickedLocation(toLatLng(feature.geometry.coordinates));
  }

  function handleMapIdle(state: MapState): void {
    reportPickedLocation(toLatLng(state.properties.center));
  }

  const styleURL = theme.mode === 'dark' ? Mapbox.StyleURL.Dark : Mapbox.StyleURL.Light;

  return (
    <View
      testID={testID}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ height, borderRadius: theme.radius.card, overflow: 'hidden' }, style]}
    >
      <MapView
        style={StyleSheet.absoluteFillObject}
        styleURL={styleURL}
        scrollEnabled={interactive}
        zoomEnabled={interactive}
        pitchEnabled={interactive}
        rotateEnabled={interactive}
        compassEnabled={false}
        scaleBarEnabled={false}
        logoEnabled
        attributionEnabled
        onPress={pinDrop ? handlePress : undefined}
        onMapIdle={pinDrop ? handleMapIdle : undefined}
      >
        <Camera
          centerCoordinate={toPosition(focusedCenter)}
          zoomLevel={zoomLevel}
          animationMode="easeTo"
          animationDuration={300}
        />

        {route && route.points.length > 1 && (
          <ShapeSource id="voyya-route-source" shape={toRouteFeature(route.points)}>
            <LineLayer
              id="voyya-route-line"
              style={{
                lineColor: theme.colors.brandPressed,
                lineWidth: 4,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          </ShapeSource>
        )}

        {markers.map((marker) => (
          <PointAnnotation key={marker.id} id={marker.id} coordinate={toPosition(marker.coord)}>
            <View
              accessible
              accessibilityLabel={marker.label ?? marker.kind}
              style={{
                width: 28,
                height: 28,
                borderRadius: theme.radius.pill,
                backgroundColor: theme.colors.surface,
                alignItems: 'center',
                justifyContent: 'center',
                ...theme.shadow.sm,
              }}
            >
              <Text style={{ fontSize: 14, color: colorForKind(marker.kind) }}>
                {GLYPH_BY_KIND[marker.kind]}
              </Text>
            </View>
          </PointAnnotation>
        ))}
      </MapView>

      {pinDrop && (
        <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
          <View
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              marginLeft: -16,
              marginTop: -32,
            }}
          >
            <Text
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={{ fontSize: 32 }}
            >
              📍
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

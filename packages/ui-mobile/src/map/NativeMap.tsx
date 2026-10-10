import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Mapbox, {
  Camera,
  LineLayer,
  MapView,
  MarkerView,
  PointAnnotation,
  ShapeSource,
  type MapState,
} from '@rnmapbox/maps';
import type { Feature } from 'geojson';
import { useTheme } from '../theme';
import { createAccessTokenApplier } from './mapbox-access-token';
import { toBounds, toLatLng, toPosition, toRouteFeature } from './geo';
import { TaxiMarker } from './TaxiMarker';
import type { MapLatLng, MapMarkerKind, MapProps } from './types';

const ensureAccessToken = createAccessTokenApplier(Mapbox);

const GLYPH_BY_KIND: Record<Exclude<MapMarkerKind, 'car'>, string> = {
  origin: '●',
  destination: '▼',
};

const ATTRIBUTION_MARGIN_DP = 16;
const DEFAULT_FIT_PADDING_DP = 48;
const DEFAULT_FIT_ZOOM = { min: 12, max: 16 } as const;

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
  fitToMarkers = false,
  fitPadding = DEFAULT_FIT_PADDING_DP,
  fitZoomRange = DEFAULT_FIT_ZOOM,
  height = 200,
  style,
  testID,
}: NativeMapProps): React.JSX.Element {
  const theme = useTheme();
  const [focusedCenter, setFocusedCenter] = useState<MapLatLng>(center);

  ensureAccessToken(accessToken);

  useEffect(() => {
    setFocusedCenter(center);
  }, [center.lat, center.lng]);

  function colorForKind(kind: MapMarkerKind): string {
    return kind === 'destination' ? theme.colors.brandInk : theme.colors.text;
  }

  const fitBounds =
    fitToMarkers && markers.length > 1 ? toBounds(markers.map((m) => m.coord)) : null;

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
  const pinDropAccessibilityLabel =
    'Mapa para marcar tu punto en pantalla. Si usas lector de pantalla, te recomendamos elegir un lugar de la lista de abajo.';

  return (
    <View
      testID={testID}
      accessible={pinDrop}
      accessibilityLabel={pinDrop ? pinDropAccessibilityLabel : undefined}
      accessibilityElementsHidden={!pinDrop}
      importantForAccessibility={pinDrop ? 'yes' : 'no-hide-descendants'}
      style={[{ height, borderRadius: theme.radius.card, overflow: 'hidden' }, style]}
    >
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={StyleSheet.absoluteFillObject}
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
          logoPosition={{ left: ATTRIBUTION_MARGIN_DP, bottom: ATTRIBUTION_MARGIN_DP }}
          attributionEnabled
          attributionPosition={{ right: ATTRIBUTION_MARGIN_DP, bottom: ATTRIBUTION_MARGIN_DP }}
          onPress={pinDrop ? handlePress : undefined}
          onMapIdle={pinDrop ? handleMapIdle : undefined}
        >
          {fitBounds ? (
            <Camera
              bounds={{
                ne: fitBounds.ne,
                sw: fitBounds.sw,
                paddingTop: fitPadding,
                paddingBottom: fitPadding,
                paddingLeft: fitPadding,
                paddingRight: fitPadding,
              }}
              minZoomLevel={fitZoomRange.min}
              maxZoomLevel={fitZoomRange.max}
              animationMode="easeTo"
              animationDuration={600}
            />
          ) : (
            <Camera
              centerCoordinate={toPosition(focusedCenter)}
              zoomLevel={zoomLevel}
              animationMode="easeTo"
              animationDuration={300}
            />
          )}

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

          {markers.map((marker) =>
            marker.kind === 'car' ? (
              <MarkerView
                key={`${marker.id}-${marker.freshness ?? 'live'}`}
                coordinate={toPosition(marker.coord)}
                anchor={{ x: 0.5, y: 0.5 }}
                allowOverlap
              >
                <TaxiMarker freshness={marker.freshness ?? 'live'} />
              </MarkerView>
            ) : (
              <PointAnnotation key={marker.id} id={marker.id} coordinate={toPosition(marker.coord)}>
                <View
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
            ),
          )}
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
              <Text style={{ fontSize: 32 }}>📍</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

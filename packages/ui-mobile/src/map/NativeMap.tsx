// =============================================================================
// VoyYa — NativeMap (packages/ui-mobile)
// -----------------------------------------------------------------------------
// ÚNICO archivo del paquete que importa `@rnmapbox/maps`. `Map.tsx` solo monta
// este componente después de confirmar (mapbox-env.ts) que hay token y que el
// módulo nativo debería existir, y lo envuelve en `MapErrorBoundary` por si
// esa comprobación no cubre algún caso imprevisto — este archivo asume que ya
// es seguro llamar a la API nativa.
//
// Glyphs de marcador (●/▼) iguales a los de `PointRow`, para que el mapa y las
// filas de texto de origen/destino se lean como el mismo lenguaje visual.
// =============================================================================

import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Mapbox, { Camera, LineLayer, MapView, PointAnnotation, ShapeSource, type MapState } from '@rnmapbox/maps';
import type { Feature } from 'geojson';
import { useTheme } from '../theme';
import { toLatLng, toPosition, toRouteFeature } from './geo';
import type { MapLatLng, MapMarkerKind, MapProps } from './types';

let tokenAppliedTo: string | null = null;

/**
 * El SDK nativo guarda el access token de forma global (una vez por proceso);
 * evita llamar a `setAccessToken` en cada render o por cada `<Map>` montado.
 */
function ensureAccessToken(token: string): void {
  if (tokenAppliedTo === token) return;
  tokenAppliedTo = token;
  void Mapbox.setAccessToken(token);
}

const GLYPH_BY_KIND: Record<MapMarkerKind, string> = {
  origen: '●',
  destino: '▼',
  carro: '🚗',
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
  // Punto que enfoca la cámara: arranca en `center` y se actualiza con la
  // interacción de pin-drop (tap o mapa asentado). Ver comentario más abajo
  // sobre por qué se re-sincroniza solo con lat/lng primitivos.
  const [focusedCenter, setFocusedCenter] = useState<MapLatLng>(center);

  useEffect(() => {
    ensureAccessToken(accessToken);
  }, [accessToken]);

  useEffect(() => {
    setFocusedCenter(center);
    // Mismo patrón que useCoverageGate: depende de lat/lng primitivos (no del
    // objeto `center`, que el padre puede recrear cada render) — re-sincroniza
    // solo cuando el PADRE cambia el punto (p.ej. eligió otro POI), sin pisar
    // el arrastre local del usuario en cada re-render.
  }, [center.lat, center.lng]);

  function colorForKind(kind: MapMarkerKind): string {
    if (kind === 'destino') return theme.colors.brandPressed;
    if (kind === 'carro') return theme.colors.success;
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
              style={{ lineColor: theme.colors.brandPressed, lineWidth: 4, lineCap: 'round', lineJoin: 'round' }}
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
              <Text style={{ fontSize: 14, color: colorForKind(marker.kind) }}>{GLYPH_BY_KIND[marker.kind]}</Text>
            </View>
          </PointAnnotation>
        ))}
      </MapView>

      {pinDrop && (
        <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
          <View style={{ position: 'absolute', top: '50%', left: '50%', marginLeft: -16, marginTop: -32 }}>
            <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ fontSize: 32 }}>
              📍
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

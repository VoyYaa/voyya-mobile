import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import Mapbox, { Camera, MapView, type MapState } from '@rnmapbox/maps';
import type { Feature } from 'geojson';
import { Skeleton } from '../components/Skeleton';
import { mapCopy } from '../copy';
import { useTheme } from '../theme';
import { planCamera, DEFAULT_ZOOM } from './camera-plan';
import { fallbackRows } from './fallback-rows';
import { resolveRoute, toLatLng, toPosition } from './geo';
import { MAP_LOAD_TIMEOUT_MS, INITIAL_MAP_LOAD_STATE, reduceMapLoad } from './map-load-state';
import { resolveMapStyleUrl } from './map-style';
import { createAccessTokenApplier } from './mapbox-access-token';
import { getMapStyleEnv } from './mapbox-env';
import { LABEL_MIN_MAP_HEIGHT } from './marker-geometry';
import { MapControlButton } from './MapControlButton';
import { MapExpandedModal } from './MapExpandedModal';
import { MapMarkerLabel } from './MapMarkerLabel';
import { MarkerLayer } from './MarkerLayer';
import { PinDropMarker } from './PinDropMarker';
import { RouteLabel, RouteLayer } from './RouteLayer';
import { useFitMarkers } from './useFitMarkers';
import type { MapLatLng, MapProps } from './types';

const ensureAccessToken = createAccessTokenApplier(Mapbox);

const ATTRIBUTION_MARGIN_DP = 16;
const FIT_ANIMATION_MS = 600;
const CONTROL_MARGIN_DP = 8;
const DEFAULT_VIEWPORT_WIDTH = 360;

let pinHintDismissed = false;

export interface NativeMapProps extends MapProps {
  accessToken: string;
}

const PIN_DROP_ACCESSIBILITY_LABEL =
  'Mapa para marcar tu punto en pantalla. Si usas lector de pantalla, te recomendamos elegir un lugar de la lista de abajo.';

export function NativeMap(props: NativeMapProps): React.JSX.Element {
  const {
    accessToken,
    center,
    zoomLevel = DEFAULT_ZOOM,
    markers = [],
    route,
    pinDrop = false,
    pinKind = 'destination',
    myLocation = null,
    onPickLocation,
    interactive = true,
    fitToMarkers,
    fitInsets,
    fitZoomRange,
    expandable = false,
    expandedTitle = mapCopy.expandedTitle,
    expandedSummary,
    height = 200,
    style,
    testID,
  } = props;
  const theme = useTheme();
  const [focusedCenter, setFocusedCenter] = useState<MapLatLng>(center);
  const [viewportWidth, setViewportWidth] = useState(DEFAULT_VIEWPORT_WIDTH);
  const [userMoved, setUserMoved] = useState(false);
  const [lifted, setLifted] = useState(false);
  const [hintVisible, setHintVisible] = useState(!pinHintDismissed);
  const [fitNonce, setFitNonce] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [load, dispatchLoad] = useReducer(reduceMapLoad, INITIAL_MAP_LOAD_STATE);
  const pickingEnabled = useRef(false);

  ensureAccessToken(accessToken);

  useEffect(() => {
    setFocusedCenter(center);
  }, [center.lat, center.lng]);

  useEffect(() => {
    const timer = setTimeout(() => dispatchLoad('timeout'), MAP_LOAD_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, []);

  const cameraMarkers = useFitMarkers(markers, userMoved);
  const plan = planCamera({
    markers: cameraMarkers,
    center: focusedCenter,
    zoomLevel,
    pinDrop,
    fitToMarkers,
    fitInsets,
    fitZoomRange,
    viewport: { width: viewportWidth, height },
  });
  const liveLabeledIds = planCamera({
    markers,
    center: focusedCenter,
    zoomLevel,
    pinDrop,
    fitToMarkers,
    fitInsets,
    fitZoomRange,
    viewport: { width: viewportWidth, height },
  }).labeledIds;
  const resolvedRoute = route ? resolveRoute(route) : null;
  const fitting = plan.kind === 'bounds';
  const canExpand = expandable && !pinDrop;

  const reportPickedLocation = useCallback(
    (next: MapLatLng | null): void => {
      if (!pinDrop || !onPickLocation || !next) return;
      setFocusedCenter(next);
      onPickLocation(next);
    },
    [pinDrop, onPickLocation],
  );

  function markFirstMovement(): void {
    pickingEnabled.current = true;
    if (!pinHintDismissed) {
      pinHintDismissed = true;
      setHintVisible(false);
    }
  }

  function handlePress(feature: Feature): void {
    if (!feature.geometry || feature.geometry.type !== 'Point') return;
    markFirstMovement();
    reportPickedLocation(toLatLng(feature.geometry.coordinates));
  }

  function handleCameraChanged(state: MapState): void {
    if (!state.gestures.isGestureActive) return;
    if (interactive) setUserMoved(true);
    if (pinDrop) {
      markFirstMovement();
      setLifted(true);
    }
  }

  function handleMapIdle(state: MapState): void {
    setLifted(false);
    if (pickingEnabled.current) reportPickedLocation(toLatLng(state.properties.center));
  }

  function handleRecenter(): void {
    setUserMoved(false);
    setFitNonce((value) => value + 1);
  }

  function handleMyLocation(): void {
    if (!myLocation) return;
    reportPickedLocation(myLocation);
  }

  function handleLayout(event: LayoutChangeEvent): void {
    setViewportWidth(Math.round(event.nativeEvent.layout.width));
  }

  const styleURL = resolveMapStyleUrl(theme.mode, getMapStyleEnv(), {
    light: Mapbox.StyleURL.Light,
    dark: Mapbox.StyleURL.Dark,
  });
  const showRouteLabel = resolvedRoute?.approximate === true && height >= LABEL_MIN_MAP_HEIGHT;
  const summaryLines = fallbackRows(markers);
  const showRecenter = interactive && fitting && userMoved;
  const showPinHint = pinDrop && hintVisible;

  return (
    <View
      testID={testID}
      onLayout={handleLayout}
      style={[{ height, borderRadius: theme.radius.card, overflow: 'hidden' }, style]}
    >
      <View
        accessible={pinDrop}
        accessibilityLabel={pinDrop ? PIN_DROP_ACCESSIBILITY_LABEL : undefined}
        accessibilityElementsHidden={!pinDrop}
        importantForAccessibility={pinDrop ? 'yes' : 'no-hide-descendants'}
        style={StyleSheet.absoluteFillObject}
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
            onCameraChanged={interactive ? handleCameraChanged : undefined}
            onMapIdle={handleMapIdle}
            onDidFinishLoadingMap={() => dispatchLoad('style_loaded')}
            onDidFinishRenderingMapFully={() => dispatchLoad('fully_rendered')}
            onDidFailLoadingMap={() => dispatchLoad('failed')}
            onMapLoadingError={() => dispatchLoad('failed')}
          >
            {plan.kind === 'bounds' ? (
              <Camera
                key={`fit-${fitNonce}`}
                bounds={{
                  ne: plan.bounds.ne,
                  sw: plan.bounds.sw,
                  paddingTop: plan.insets.top,
                  paddingBottom: plan.insets.bottom,
                  paddingLeft: plan.insets.left,
                  paddingRight: plan.insets.right,
                }}
                minZoomLevel={plan.zoomRange.min}
                maxZoomLevel={plan.zoomRange.max}
                animationMode="easeTo"
                animationDuration={FIT_ANIMATION_MS}
              />
            ) : (
              <Camera
                key={`center-${fitNonce}`}
                centerCoordinate={toPosition(plan.center)}
                zoomLevel={plan.zoom}
                animationMode="easeTo"
                animationDuration={300}
              />
            )}

            {resolvedRoute && (
              <RouteLayer points={resolvedRoute.points} approximate={resolvedRoute.approximate} />
            )}
            {resolvedRoute && showRouteLabel && <RouteLabel points={resolvedRoute.points} />}
            <MarkerLayer markers={markers} labeledIds={liveLabeledIds} />
          </MapView>

          {pinDrop && (
            <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
              <PinDropMarker kind={pinKind} lifted={lifted} />
            </View>
          )}
        </View>
      </View>

      {!load.ready && (
        <View
          accessible
          accessibilityLabel={mapCopy.loading}
          style={[StyleSheet.absoluteFillObject, { backgroundColor: theme.colors.surfaceAlt }]}
        >
          <Skeleton height={height} radius={theme.radius.card} accent />
        </View>
      )}

      {load.degraded && (
        <View
          accessibilityLiveRegion="polite"
          style={{
            position: 'absolute',
            top: CONTROL_MARGIN_DP,
            left: CONTROL_MARGIN_DP,
            right: CONTROL_MARGIN_DP + theme.touch.min + CONTROL_MARGIN_DP,
            alignItems: 'flex-start',
          }}
        >
          <View
            style={{
              borderRadius: theme.radius.pill,
              backgroundColor: theme.colors.infoTint,
              paddingHorizontal: theme.spacing.md,
              paddingVertical: theme.spacing.xs,
            }}
          >
            <Text
              maxFontSizeMultiplier={1.3}
              style={{ ...theme.typography.smallStrong, color: theme.colors.infoInk }}
            >
              {mapCopy.offlineStrip}
            </Text>
          </View>
        </View>
      )}

      {showPinHint && (
        <View
          pointerEvents="none"
          style={{ position: 'absolute', top: CONTROL_MARGIN_DP, alignSelf: 'center' }}
        >
          <MapMarkerLabel text={mapCopy.pinHint} />
        </View>
      )}

      {canExpand && (
        <Pressable
          accessible={false}
          importantForAccessibility="no"
          onPress={() => setExpanded(true)}
          style={StyleSheet.absoluteFillObject}
        />
      )}

      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          top: CONTROL_MARGIN_DP,
          right: CONTROL_MARGIN_DP,
          gap: CONTROL_MARGIN_DP,
        }}
      >
        {canExpand && (
          <MapControlButton
            icon="expand"
            label={mapCopy.expand}
            onPress={() => setExpanded(true)}
            testID="map-expand-button"
          />
        )}
        {showRecenter && (
          <MapControlButton
            icon="recenter"
            label={mapCopy.recenter}
            onPress={handleRecenter}
            testID="map-recenter-button"
          />
        )}
      </View>

      {pinDrop && myLocation && (
        <View
          pointerEvents="box-none"
          style={{
            position: 'absolute',
            right: CONTROL_MARGIN_DP,
            top: '50%',
            marginTop: -theme.touch.min / 2,
          }}
        >
          <MapControlButton
            icon="locate"
            label={mapCopy.myLocation}
            onPress={handleMyLocation}
            testID="map-my-location-button"
          />
        </View>
      )}

      {canExpand && (
        <MapExpandedModal
          visible={expanded}
          title={expandedTitle}
          onClose={() => setExpanded(false)}
          summary={
            expandedSummary ?? (
              <>
                {summaryLines.map((line) => (
                  <Text
                    key={line.id}
                    style={{ ...theme.typography.body, color: theme.colors.text }}
                  >
                    {line.text}
                  </Text>
                ))}
                {resolvedRoute?.approximate && (
                  <Text style={{ ...theme.typography.small, color: theme.colors.textMuted }}>
                    {mapCopy.routeApproximate}
                  </Text>
                )}
              </>
            )
          }
          renderMap={(mapHeight) =>
            expanded ? (
              <NativeMap
                {...props}
                expandable={false}
                interactive
                height={mapHeight}
                style={undefined}
                testID={testID ? `${testID}-expanded` : undefined}
              />
            ) : null
          }
        />
      )}
    </View>
  );
}

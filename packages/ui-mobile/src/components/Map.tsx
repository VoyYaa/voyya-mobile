// =============================================================================
// VoyYa — Map (packages/ui-mobile)
// -----------------------------------------------------------------------------
// Mapa real de Mapbox con pin-drop, ver docs/specs/decision-geocodificacion-yarumal.md
// ("la geocodificación por texto de Yarumal es insuficiente — pin-drop + POIs
// locales es el método principal"). Fallback ROBUSTO en tres capas — la app
// nunca debe crashear por no tener el mapa real disponible:
//
//   1) sin `EXPO_PUBLIC_MAPBOX_TOKEN`        → MapFallback (mapbox-env.ts).
//   2) Expo Go (módulo nativo no existe ahí) → MapFallback (mapbox-env.ts).
//   3) cualquier otro fallo nativo imprevisto → MapErrorBoundary → MapFallback.
//
// Solo se importa `@rnmapbox/maps` (vía NativeMap) cuando (1) y (2) ya se
// verificaron — así el módulo nativo nunca se toca en un entorno donde no
// puede funcionar.
//
// NOTA sobre el "download token" (secreto `sk.…`, scope DOWNLOADS:READ) que
// pide la guía de instalación del plugin para el BUILD nativo (no en runtime):
// la versión instalada (@rnmapbox/maps 10.2.10, Mapbox SDK v11.16) YA NO LO
// EXIGE — Mapbox retiró ese requisito y el propio mantenedor recomienda no
// configurarlo (github.com/rnmapbox/maps/discussions/4064: "Since mapbox no
// longer requires download tokens, just remove both RNMapboxMapsDownloadToken
// and RNMAPBOX_MAPS_DOWNLOAD_TOKEN"). El único token que ESTE componente
// necesita es el PÚBLICO (`pk.…`), vía `EXPO_PUBLIC_MAPBOX_TOKEN`. Si algún
// día se fija una `RNMapboxMapsVersion` de la serie 10 (SDK antiguo) en el
// plugin de app.json, ese requisito viejo podría reaparecer — en ese caso
// documentado (no hoy) se configuraría `RNMAPBOX_MAPS_DOWNLOAD_TOKEN` como
// EAS secret, leído directo por Gradle/Podfile en build time, nunca en app.json.
// =============================================================================

import React from 'react';
import { getMapboxAccessToken, isNativeMapAvailable } from '../map/mapbox-env';
import { MapErrorBoundary } from '../map/MapErrorBoundary';
import { MapFallback } from '../map/MapFallback';
import { NativeMap } from '../map/NativeMap';
import type { MapProps } from '../map/types';

export type { MapLatLng, MapMarker, MapMarkerKind, MapProps, MapRoute } from '../map/types';

export function Map(props: MapProps): React.JSX.Element {
  const token = getMapboxAccessToken();

  if (!token || !isNativeMapAvailable()) {
    return <MapFallback height={props.height} style={props.style} testID={props.testID} />;
  }

  return (
    <MapErrorBoundary
      fallback={<MapFallback height={props.height} style={props.style} testID={props.testID} />}
    >
      <NativeMap {...props} accessToken={token} />
    </MapErrorBoundary>
  );
}

// =============================================================================
// VoyYa — Tipos del mapa (packages/ui-mobile)
// -----------------------------------------------------------------------------
// Deliberadamente SIN depender de @voyya/shared: este paquete es presentacional
// (coding-standards.md §SOLID-S — "un componente presentacional no tiene lógica
// de negocio"), así que declara su propio tipo geográfico mínimo en vez de
// importar `Coordenada`/`Ubicacion`. Como ambos son estructuralmente `{lat,lng}`,
// TypeScript acepta pasar un `Ubicacion` real donde se pide `MapLatLng` sin
// necesidad de conversión ni de que ui-mobile conozca ese paquete de dominio.
// =============================================================================

import type { StyleProp, ViewStyle } from 'react-native';

export interface MapLatLng {
  lat: number;
  lng: number;
}

/**
 * Colores fijados por el design system (ver NativeMap.tsx `colorForKind`):
 * origen = texto neutro, destino = brandPressed (mismo criterio que
 * `PointRow`), carro = success ("go"). `carro` queda soportado en el tipo para
 * cuando exista una fuente real de posición del conductor (EV1 / tracking en
 * vivo) — ningún flujo de ESTE build lo usa con datos inventados.
 */
export type MapMarkerKind = 'origen' | 'destino' | 'carro';

export interface MapMarker {
  id: string;
  kind: MapMarkerKind;
  coord: MapLatLng;
  /** Etiqueta de accesibilidad del pin; por defecto se anuncia el `kind`. */
  label?: string;
}

export interface MapRoute {
  /** Puntos ordenados de la polilínea. Con 2 puntos (origen→destino) es una
   *  línea recta ilustrativa, NO una ruta real calculada (no hay integración
   *  de Directions API en este build). */
  points: readonly MapLatLng[];
}

/**
 * `Map` es SIEMPRE decorativo para lectores de pantalla (`accessibilityElementsHidden`
 * + `no-hide-descendants`, ver NativeMap.tsx) — mismo criterio que el
 * placeholder original que reemplaza. Por eso no expone `accessibilityLabel`:
 * cada pantalla que lo usa debe tener una vía de texto equivalente (PointRow,
 * filas de POI/sugerencias, DriverCard…) para que un usuario de VoiceOver/
 * TalkBack pueda completar la misma acción sin el mapa. Si algún día se
 * necesita un mapa realmente enfocable (no hay ese caso hoy), este es el
 * lugar para reabrir esa decisión.
 */
export interface MapProps {
  /** Centro de cámara. En modo `pinDrop`, es el punto de partida — el usuario
   *  lo mueve tocando el mapa o desplazándolo bajo el pin central fijo. */
  center: MapLatLng;
  zoomLevel?: number;
  markers?: readonly MapMarker[];
  route?: MapRoute;
  /**
   * Modo pin-drop (ver docs/specs/decision-geocodificacion-yarumal.md): método
   * PRINCIPAL de selección de origen/destino en Yarumal, porque la
   * geocodificación por texto no es confiable ahí. Muestra un pin fijo en el
   * centro de la pantalla; `onPickLocation` se dispara al tocar el mapa y cada
   * vez que el mapa se asienta tras moverlo (`onMapIdle`).
   */
  pinDrop?: boolean;
  onPickLocation?: (coord: MapLatLng) => void;
  /**
   * `false` desactiva pan/zoom/pitch/rotate nativos — para previews de solo
   * lectura embebidas en un ScrollView/FlatList (evita que el mapa "robe" el
   * gesto de scroll de la pantalla). Por defecto `true`; los usos de pin-drop
   * SIEMPRE deben dejarlo en `true` (es como se fija el punto).
   */
  interactive?: boolean;
  height?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

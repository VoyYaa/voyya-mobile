// =============================================================================
// VoyYa — Capacidad del mapa nativo (packages/ui-mobile)
// -----------------------------------------------------------------------------
// Dos comprobaciones BARATAS y sin tocar `@rnmapbox/maps` en absoluto: si
// cualquiera falla, `Map.tsx` ni siquiera importa/monta el módulo nativo.
// Esto es lo que evita el crash en Expo Go / sin token, no un try/catch
// alrededor del import (ver notas de Map.tsx sobre por qué no hace falta).
// =============================================================================

import Constants, { AppOwnership, ExecutionEnvironment } from 'expo-constants';

/**
 * Token PÚBLICO de Mapbox (`pk.…`), inline por Expo en build time desde
 * `EXPO_PUBLIC_MAPBOX_TOKEN` (ver app.json / notas de entrega). Devuelve
 * `null` si falta o está vacío — nunca se le pasa "" a `Mapbox.setAccessToken`.
 *
 * OJO: esto NO es el "download token" (`sk.…`, scope DOWNLOADS:READ) que pide
 * el config plugin para el build nativo — ese es un secreto de build distinto,
 * ver el comentario en Map.tsx.
 */
export function getMapboxAccessToken(): string | null {
  const token = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
  return typeof token === 'string' && token.length > 0 ? token : null;
}

/**
 * `@rnmapbox/maps` es un módulo nativo: no existe en Expo Go (requiere el
 * config plugin + dev-client/EAS build — ver plugins en app.json). Sin esta
 * comprobación, montar `<Mapbox.MapView>` ahí revienta con
 * "requireNativeComponent: ... was not found in the UIManager".
 *
 * Se comprueban dos señales por robustez entre versiones/plataformas de Expo
 * (SDK 51): `appOwnership` es la señal clásica, `executionEnvironment` la más
 * nueva. Cualquiera de las dos en verdadero basta para considerarlo Expo Go.
 */
export function isNativeMapAvailable(): boolean {
  const runningInExpoGo =
    Constants.appOwnership === AppOwnership.Expo ||
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
  return !runningInExpoGo;
}

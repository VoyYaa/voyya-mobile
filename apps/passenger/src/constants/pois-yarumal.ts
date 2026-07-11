// =============================================================================
// VoyYa Pasajero — POIs curados de Yarumal
// -----------------------------------------------------------------------------
// docs/specs/decision-geocodificacion-yarumal.md: la geocodificación POR TEXTO
// de Yarumal en Mapbox es insuficiente para producción (POIs que no resuelven
// o devuelven OTRO municipio; direcciones con baja confianza). La "búsqueda"
// real del MVP es esta tabla de POIs con coordenadas verificadas a mano +
// pin-drop — NUNCA texto libre geocodificado como única fuente.
//
// TODO(Cootrayal): verificar en campo TODAS las coordenadas de esta lista
// antes del lanzamiento del MVP (ver esa decisión, sección "Pendiente": "~20–30
// POIs de Yarumal"). Esta es solo la lista STARTER con las 4 categorías que
// pidió el brief — el resto de POIs frecuentes (barrios, más comercios) se
// suman después de esa validación.
//
// Import de `Coordenada` (no un tipo propio): fuente única de verdad para el
// par lat/lng en todo el monorepo (coding-standards.md §DRY) — es
// estructuralmente compatible con `MapLatLng` de @voyya/ui-mobile sin
// conversión.
// =============================================================================

import type { Coordenada } from '@voyya/shared';

export type CategoriaPoiYarumal = 'plaza' | 'salud' | 'gobierno' | 'transporte';

export interface PoiYarumal {
  id: string;
  icono: string;
  titulo: string;
  categoria: CategoriaPoiYarumal;
  /**
   * `null` = coordenada AÚN NO verificada — a propósito. No se inventan coords
   * de POIs cuya ubicación real no se conoce (regla explícita de la decisión).
   * Estos POIs se muestran en la lista mercados como "pendiente" y NO se
   * pueden seleccionar directamente; el pasajero usa pin-drop mientras tanto.
   */
  coord: Coordenada | null;
}

export const POIS_YARUMAL: readonly PoiYarumal[] = [
  {
    id: 'parque-principal',
    icono: '⛪',
    titulo: 'Parque Principal',
    categoria: 'plaza',
    // Único punto con evidencia citada en la decisión (Mapbox Geocoding v6,
    // "Parque Principal, Yarumal, Antioquia" → centro del municipio). Se
    // acepta como aproximación razonable del parque central; sigue pendiente
    // de una verificación de campo más fina (ver TODO arriba).
    coord: { lat: 6.9617, lng: -75.4185 },
  },
  {
    id: 'hospital-san-juan-de-dios',
    icono: '🏥',
    titulo: 'Hospital San Juan de Dios',
    categoria: 'salud',
    // TODO(Cootrayal): la geocodificación por texto devolvió el MUNICIPIO
    // EQUIVOCADO para este POI ("San Juan, Guadalupe, Antioquia" — ver la
    // decisión). No inventar coordenadas: pendiente de verificar en campo.
    coord: null,
  },
  {
    id: 'alcaldia',
    icono: '🏛️',
    titulo: 'Alcaldía de Yarumal',
    categoria: 'gobierno',
    // TODO(Cootrayal): la geocodificación solo ubica el centro del municipio,
    // no el edificio — pendiente de verificar en campo.
    coord: null,
  },
  {
    id: 'terminal',
    icono: '🚌',
    titulo: 'Terminal de Transportes',
    categoria: 'transporte',
    // TODO(Cootrayal): pendiente de verificar en campo.
    coord: null,
  },
];

// =============================================================================
// VoyYa Pasajero — Datos de demostración (lugares guardados + sugerencias)
// -----------------------------------------------------------------------------
// Placeholder mientras no exista un backend de "lugares favoritos" ni
// geocodificación real (Mapbox — ver docs/VoyYa/14-stack-tecnologico.md §7.2,
// "acción bloqueante previa" aún pendiente de validar en Yarumal). Coordenadas
// dentro del rango de Colombia que exige `Coordenada` de @voyya/shared.
// =============================================================================

export interface LugarSugerido {
  id: string;
  icono: string;
  titulo: string;
  subtitulo: string;
  lat: number;
  lng: number;
}

export const LUGARES_GUARDADOS: LugarSugerido[] = [
  { id: 'casa', icono: '🏠', titulo: 'Casa', subtitulo: 'Guardado', lat: 6.9615, lng: -75.4192 },
  { id: 'hospital', icono: '🏥', titulo: 'Hospital San Vicente', subtitulo: 'Cra 19', lat: 6.9642, lng: -75.4171 },
  { id: 'parque', icono: '⛪', titulo: 'Parque Principal', subtitulo: 'Centro', lat: 6.9601, lng: -75.4184 },
];

export const SUGERENCIAS_DESTINO: LugarSugerido[] = [
  ...LUGARES_GUARDADOS,
  { id: 'terminal', icono: '🚌', titulo: 'Terminal de Transportes', subtitulo: 'Salida sur', lat: 6.9553, lng: -75.4218 },
  { id: 'colegio', icono: '🏫', titulo: 'Colegio San Luis Gonzaga', subtitulo: 'Cra 22', lat: 6.9629, lng: -75.4149 },
  { id: 'plaza', icono: '🛒', titulo: 'Plaza de Mercado', subtitulo: 'Centro', lat: 6.9598, lng: -75.4201 },
];

/**
 * Ubicación actual simulada (placeholder de expo-location, fuera de alcance de
 * este ciclo — ver notas de entrega). Cambia este punto para ensayar el estado
 * "fuera de cobertura" del origen (§5.2 de pasajero-estados-borde.md) contra
 * un backend con un polígono de cobertura real.
 */
export const UBICACION_ACTUAL_MOCK = {
  direccion: 'Calle 20 #22-04 · Yarumal',
  lat: 6.9612,
  lng: -75.4178,
};

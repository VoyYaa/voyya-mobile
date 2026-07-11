// =============================================================================
// VoyYa Pasajero — Espejo temporal de `parametros_sistema` (backend)
// -----------------------------------------------------------------------------
// `packages/shared` es de SOLO LECTURA en este ciclo y aún no expone estos
// valores vía contrato/endpoint (no hay un `GET /parametros` ni campos en
// `EstadoSolicitudViaje` para ellos). Para no hardcodear el mismo número en
// dos lugares del frontend (checklist de DoD de pasajero-estados-borde.md §9),
// se centraliza AQUÍ una sola vez. Cuando exista el endpoint/campo real, este
// archivo se reemplaza por esa fuente y desaparece — no debe crecer más.
// =============================================================================

/** Ventana de cancelación gratuita tras `asignada` (HU-05). Backend: ventana_cancelacion_min. */
export const VENTANA_CANCELACION_GRATIS_MIN = 2;

/**
 * Umbral (segundos) a partir del cual "Buscando…" muestra la segunda línea de
 * copy "Seguimos buscando…" (pasajero-estados-borde.md §3.5 sugiere 45–60 s).
 */
export const UMBRAL_BUSQUEDA_PROLONGADA_SEG = 50;

/** Intervalo de reintento de reconexión (igual en Pasajero y Conductor). */
export const RETRY_INTERVALO_CONEXION_SEG = 15;

/** Frecuencia de polling de `GET /trips/:id` mientras el socket no confirme algo antes. */
export const POLL_ESTADO_SOLICITUD_MS = 4000;

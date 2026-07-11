// =============================================================================
// VoyYa Conductor — Espejo temporal de `parametros_sistema` (backend)
// -----------------------------------------------------------------------------
// `packages/shared` es de SOLO LECTURA en este ciclo y no expone estos valores
// vía contrato/endpoint todavía (no hay `GET /parametros`). Para no hardcodear
// el mismo número en dos lugares del frontend (checklist DoD de
// conductor-solicitud-asignacion.md §4: "Ninguna solicitud usa 15 o 2 (km) como
// literal"), se centraliza AQUÍ una sola vez — igual que
// apps/passenger/src/constants/parametros.ts. Estos son solo FALLBACKS de UI
// quando el payload del servidor no trae el valor real (p.ej. copy estático de
// "Reglas de asignación" antes de recibir una notificación): el countdown en sí
// SIEMPRE usa `segundos_para_responder`/`expira_en` del payload, nunca esta
// constante (ver hooks/useCountdown.ts y app/solicitudes/[id].tsx).
// =============================================================================

/** Fallback de copy estático (tarjeta de reglas) — el countdown real viene del payload del servidor. */
export const TIMEOUT_ACEPTACION_FALLBACK_SEG = 15;

/** Fallback de copy estático (tarjeta de reglas). Backend: `radio_busqueda_km`. */
export const RADIO_BUSQUEDA_FALLBACK_KM = 2;

/** A partir de qué segundo restante el countdown pasa a `color.danger` (§3.4.1). */
export const COUNTDOWN_WARN_THRESHOLD_SEG = 5;

/** Intervalo de reintento de reconexión (igual en Pasajero y Conductor — heartbeat). */
export const RETRY_INTERVALO_CONEXION_SEG = 15;

/** Frecuencia de polling de la lista de solicitudes cercanas mientras el conductor está en turno. */
export const POLL_SOLICITUDES_CERCANAS_MS = 4000;

/** Timeout de cliente esperando la respuesta de Aceptar/Rechazar (§3.4.2: 8 s, nunca "girando" indefinidamente). */
export const TIMEOUT_RESPUESTA_ACCION_MS = 8000;

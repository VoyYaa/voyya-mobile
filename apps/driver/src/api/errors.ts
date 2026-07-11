// =============================================================================
// VoyYa Conductor — Error tipado de la capa API
// -----------------------------------------------------------------------------
// Mismo patrón que apps/passenger/src/api/errors.ts (DRY de PATRÓN, no de código
// entre apps — cada app Expo es un deployable independiente). Unifica 3 causas
// de fallo para que hooks/pantallas decidan la presentación correcta: network →
// "sin conexión" (§3.4.7 de conductor-solicitud-asignacion.md); http → error de
// dominio tipado (`codigo` de CodigoErrorAssignment); validation → la respuesta
// no cumplió el contrato de @voyya/shared (nunca se muestra como dato válido).
//
// IMPORTANTE (ver assignment.api.ts): 409/410 de `POST /assignments/:id/aceptar`
// NO son `ApiError` — son resultados válidos de `ResultadoAceptacion` (discriminated
// union). Este tipo de error es SOLO para fallos de red/HTTP genéricos/validación.
// =============================================================================

export type ApiErrorKind = 'network' | 'http' | 'validation';

export class ApiError extends Error {
  constructor(
    public readonly kind: ApiErrorKind,
    message: string,
    public readonly status?: number,
    public readonly codigo?: string,
    /** Segundos hasta poder reintentar — presente en `CUENTA_BLOQUEADA_TEMPORAL` (ErrorAuth). */
    public readonly reintentarEnSeg?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** `true` cuando el fallo es de conectividad (dispara "sin conexión al responder"), no del dominio. */
export function esErrorDeRed(error: unknown): boolean {
  return error instanceof ApiError && error.kind === 'network';
}

/** Extrae el código de dominio (p.ej. `NO_ES_EL_CONDUCTOR`) si el error viene del backend. */
export function codigoErrorDominio(error: unknown): string | undefined {
  return error instanceof ApiError && error.kind === 'http' ? error.codigo : undefined;
}

/** Segundos hasta reintentar (bloqueo temporal de PIN) si el backend lo envió. */
export function reintentarEnSegDe(error: unknown): number | undefined {
  return error instanceof ApiError ? error.reintentarEnSeg : undefined;
}

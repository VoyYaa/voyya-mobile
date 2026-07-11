// =============================================================================
// VoyYa Pasajero — Error tipado de la capa API
// -----------------------------------------------------------------------------
// Unifica 3 causas de fallo distintas para que los hooks/pantallas decidan la
// presentación correcta (network → banner "sin conexión"; http → mensaje del
// dominio con `codigo` tipado; validation → la respuesta no cumplió el
// contrato de @voyya/shared, nunca se debe mostrar como si fuera dato válido).
// =============================================================================

export type ApiErrorKind = 'network' | 'http' | 'validation';

export class ApiError extends Error {
  constructor(
    public readonly kind: ApiErrorKind,
    message: string,
    public readonly status?: number,
    public readonly codigo?: string,
    /** Segundos hasta poder reintentar — presente en `OTP_RATE_LIMIT`/`CUENTA_BLOQUEADA_TEMPORAL` (ErrorAuth). */
    public readonly reintentarEnSeg?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** `true` cuando el fallo es de conectividad (dispara el estado "sin conexión"), no del dominio. */
export function esErrorDeRed(error: unknown): boolean {
  return error instanceof ApiError && error.kind === 'network';
}

/** Extrae el código de dominio (p.ej. `FUERA_DE_COBERTURA`) si el error viene del backend. */
export function codigoErrorDominio(error: unknown): string | undefined {
  return error instanceof ApiError && error.kind === 'http' ? error.codigo : undefined;
}

/** Segundos hasta reintentar (rate-limit de OTP) si el backend lo envió. */
export function reintentarEnSegDe(error: unknown): number | undefined {
  return error instanceof ApiError ? error.reintentarEnSeg : undefined;
}

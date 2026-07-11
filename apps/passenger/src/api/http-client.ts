// =============================================================================
// VoyYa Pasajero — Cliente HTTP tipado
// -----------------------------------------------------------------------------
// Envoltorio fino sobre `fetch` (disponible en RN/Hermes — sin axios, KISS).
// Responsabilidad ÚNICA: enviar la request y devolver datos ya validados con
// el esquema Zod de `@voyya/shared` — nunca un `any`/`unknown` sin parsear.
// Los errores del dominio (409/410/etc.) se parsean con `ErrorTrips` (o el
// esquema de error que reciba el llamador, para poder reusarse con otros
// dominios como `assignment`/`auth` en el futuro sin tocar este archivo — abierto/cerrado).
//
// AUTENTICACIÓN (decisiones-construccion-autenticacion.md D-A04): este módulo
// NUNCA importa Zustand ni conoce `useSessionStore` directamente (evita un
// import circular y mantiene el transporte agnóstico del estado — inversión de
// dependencia). `state/useSessionStore.ts` LLAMA a `configureAuthHandlers(...)`
// una vez al importarse, inyectando cómo leer el access token vigente y cómo
// refrescar la sesión. `skipAuth: true` es para los propios endpoints públicos
// de auth (otp/solicitar, otp/verificar, refresh, logout) — nunca deben
// adjuntar el access token vigente ni disparar el reintento de refresh en 401.
// =============================================================================

import { z } from 'zod';
import { ErrorTrips } from '@voyya/shared';
import { ApiError } from './errors';

const DEFAULT_BASE_URL = 'http://localhost:3000';

function resolveBaseUrl(): string {
  // EXPO_PUBLIC_* se inyecta en build-time por Expo (ver .env.example).
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  return fromEnv && fromEnv.length > 0 ? fromEnv : DEFAULT_BASE_URL;
}

export interface AuthHandlers {
  /** Access token vigente en memoria (o `null` si no hay sesión). Lectura síncrona. */
  getAccessToken: () => string | null;
  /** Intenta refrescar UNA vez (rota ambos tokens). `null` si no se pudo (ya deja la sesión limpia). */
  refreshAndRetry: () => Promise<string | null>;
  /** El refresh también falló: ya no hay sesión válida (el handler limpia el estado/local storage). */
  onSessionExpired: () => void;
}

let authHandlers: AuthHandlers | null = null;

/** Inyectado por `state/useSessionStore.ts` al importarse — ver nota de arriba. */
export function configureAuthHandlers(handlers: AuthHandlers): void {
  authHandlers = handlers;
}

interface ApiRequestOptions {
  method: 'GET' | 'POST';
  path: string;
  body?: unknown;
  /** `true` para los 4 endpoints públicos de `/auth/*` que consume esta app (ver nota de arriba). */
  skipAuth?: boolean;
}

const GenericErrorShape = z.object({ codigo: z.string(), mensaje: z.string() });
/** `OTP_RATE_LIMIT`/`CUENTA_BLOQUEADA_TEMPORAL` (ErrorAuth) traen este campo opcional además de
 *  `{codigo,mensaje}` — se extrae aparte para no ensanchar `GenericErrorShape`, que es genérico
 *  entre dominios (trips/assignment no lo tienen). */
const ReintentarEnSegShape = z.object({ reintentar_en_seg: z.number().int().positive().optional() });

export function apiRequest<TResponse>(
  options: ApiRequestOptions,
  responseSchema: z.ZodType<TResponse>,
  errorSchema: z.ZodType<z.infer<typeof GenericErrorShape>> = ErrorTrips,
): Promise<TResponse> {
  return performRequest(options, responseSchema, errorSchema, false);
}

async function performRequest<TResponse>(
  options: ApiRequestOptions,
  responseSchema: z.ZodType<TResponse>,
  errorSchema: z.ZodType<z.infer<typeof GenericErrorShape>>,
  isRetry: boolean,
): Promise<TResponse> {
  const accessToken = options.skipAuth ? null : (authHandlers?.getAccessToken() ?? null);

  let res: Response;
  try {
    res = await fetch(`${resolveBaseUrl()}${options.path}`, {
      method: options.method,
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    // RN lanza TypeError ("Network request failed") cuando no hay conectividad
    // real con el servidor — es la señal que dispara el estado "sin conexión".
    throw new ApiError('network', 'No hay conexión con el servidor.');
  }

  // 401 con sesión activa: UN solo reintento tras refrescar (D-A04) — nunca en
  // cadena (`isRetry` evita que la request reintentada dispare otro refresh).
  if (res.status === 401 && !options.skipAuth && !isRetry && authHandlers) {
    const newToken = await authHandlers.refreshAndRetry();
    if (newToken) {
      return performRequest(options, responseSchema, errorSchema, true);
    }
    authHandlers.onSessionExpired();
  }

  const json: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    const parsedError = errorSchema.safeParse(json);
    if (parsedError.success) {
      const conBackoff = ReintentarEnSegShape.safeParse(json);
      throw new ApiError(
        'http',
        parsedError.data.mensaje,
        res.status,
        parsedError.data.codigo,
        conBackoff.success ? conBackoff.data.reintentar_en_seg : undefined,
      );
    }
    throw new ApiError('http', `Error inesperado del servidor (${res.status}).`, res.status);
  }

  const parsed = responseSchema.safeParse(json);
  if (!parsed.success) {
    throw new ApiError('validation', 'La respuesta del servidor no tiene el formato esperado.');
  }
  return parsed.data;
}

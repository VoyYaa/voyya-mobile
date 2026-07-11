// =============================================================================
// VoyYa Conductor — Cliente HTTP tipado
// -----------------------------------------------------------------------------
// Mismo patrón que apps/passenger/src/api/http-client.ts (fetch nativo, sin
// axios — KISS). Responsabilidad ÚNICA: enviar la request y devolver datos ya
// validados con el esquema Zod de `@voyya/shared` — nunca `any`/`unknown` sin
// parsear.
//
// AUTENTICACIÓN (decisiones-construccion-autenticacion.md D-A04): reemplaza a
// los headers de dev `x-conductor-id`/`x-empresa-id` que usaba este archivo
// antes del ciclo de auth — la identidad/tenant ahora viaja en el JWT
// (`JwtAccessPayload.sub`/`id_empresa`), que el AuthGuard del backend decodifica
// en `req.user` (ver apps/api/.../tenancy/identity.decorators.ts, que ya cae a
// los headers de dev SOLO como fallback si no hay `req.user`). Este módulo NO
// importa Zustand ni conoce `useSessionStore` directamente (evita un import
// circular e inversión de dependencia, igual que en Pasajero):
// `state/useSessionStore.ts` llama a `configureAuthHandlers(...)` una vez al
// importarse. `skipAuth: true` es para el propio login (`/auth/conductor/login`)
// y el resto de endpoints públicos de auth — nunca adjuntan el access token
// vigente ni disparan el reintento de refresh en 401.
// =============================================================================

import { z } from 'zod';
import { ErrorAssignment } from '@voyya/shared';
import { ApiError } from './errors';

const DEFAULT_BASE_URL = 'http://localhost:3000';

export function resolveBaseUrl(): string {
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

/** `{ Authorization: 'Bearer …' }` (o `{}` sin sesión) — la usan tanto este
 *  archivo como assignment.api.ts (`aceptarAsignacion`, que arma su propio
 *  `fetch` — ver ese archivo para el porqué). */
export function buildAuthHeader(): Record<string, string> {
  const token = authHandlers?.getAccessToken() ?? null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface ApiRequestOptions {
  method: 'GET' | 'POST';
  path: string;
  body?: unknown;
  /** AbortSignal opcional (p.ej. timeout de cliente de 8 s al aceptar — §3.4.2). */
  signal?: AbortSignal;
  /** `true` para los endpoints públicos de `/auth/*` (login, refresh, logout). */
  skipAuth?: boolean;
}

const GenericErrorShape = z.object({ codigo: z.string(), mensaje: z.string() });
/** `CUENTA_BLOQUEADA_TEMPORAL` (ErrorAuth) trae este campo opcional además de
 *  `{codigo,mensaje}` — se extrae aparte para no ensanchar `GenericErrorShape`,
 *  que es genérico entre dominios (assignment no lo tiene). */
const ReintentarEnSegShape = z.object({ reintentar_en_seg: z.number().int().positive().optional() });

/**
 * Envoltorio genérico: usa este helper SOLO cuando cualquier respuesta no-2xx es
 * un error de dominio real. `POST /assignments/:id/aceptar` NO cumple esa regla
 * (409/410 son resultados válidos, no errores) — ver assignment.api.ts, que
 * implementa su propio manejo de respuesta para ese único endpoint.
 */
export function apiRequest<TResponse>(
  options: ApiRequestOptions,
  responseSchema: z.ZodType<TResponse>,
  errorSchema: z.ZodType<z.infer<typeof GenericErrorShape>> = ErrorAssignment,
): Promise<TResponse> {
  return performRequest(options, responseSchema, errorSchema, false);
}

async function performRequest<TResponse>(
  options: ApiRequestOptions,
  responseSchema: z.ZodType<TResponse>,
  errorSchema: z.ZodType<z.infer<typeof GenericErrorShape>>,
  isRetry: boolean,
): Promise<TResponse> {
  let res: Response;
  try {
    res = await fetch(`${resolveBaseUrl()}${options.path}`, {
      method: options.method,
      headers: {
        'Content-Type': 'application/json',
        ...(options.skipAuth ? {} : buildAuthHeader()),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
    });
  } catch (e) {
    // AbortError (timeout de cliente) y "Network request failed" (RN/Hermes sin
    // conectividad) se tratan igual: ambos disparan el estado "sin conexión".
    throw new ApiError('network', mensajeDeRed(e));
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

function mensajeDeRed(e: unknown): string {
  if (e instanceof Error && e.name === 'AbortError') {
    return 'El servidor no respondió a tiempo.';
  }
  return 'No hay conexión con el servidor.';
}

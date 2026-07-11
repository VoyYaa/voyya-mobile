import { z } from 'zod';
import { AssignmentError } from '@voyyaa/shared';
import { ApiError } from './errors';

const DEFAULT_BASE_URL = 'http://localhost:3000';

export function resolveBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  return fromEnv && fromEnv.length > 0 ? fromEnv : DEFAULT_BASE_URL;
}

export interface AuthHandlers {
  getAccessToken: () => string | null;
  refreshAndRetry: () => Promise<string | null>;
  onSessionExpired: () => void;
}

let authHandlers: AuthHandlers | null = null;

export function configureAuthHandlers(handlers: AuthHandlers): void {
  authHandlers = handlers;
}

export function buildAuthHeader(): Record<string, string> {
  const token = authHandlers?.getAccessToken() ?? null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface ApiRequestOptions {
  method: 'GET' | 'POST';
  path: string;
  body?: unknown;
  signal?: AbortSignal;
  skipAuth?: boolean;
}

const GenericErrorShape = z.object({ code: z.string(), message: z.string() });
const RetryInSecShape = z.object({ retry_in_sec: z.number().int().positive().optional() });

export function apiRequest<TResponse>(
  options: ApiRequestOptions,
  responseSchema: z.ZodType<TResponse>,
  errorSchema: z.ZodType<z.infer<typeof GenericErrorShape>> = AssignmentError,
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
    throw new ApiError('network', networkErrorMessage(e));
  }

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
      const withBackoff = RetryInSecShape.safeParse(json);
      throw new ApiError(
        'http',
        parsedError.data.message,
        res.status,
        parsedError.data.code,
        withBackoff.success ? withBackoff.data.retry_in_sec : undefined,
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

function networkErrorMessage(e: unknown): string {
  if (e instanceof Error && e.name === 'AbortError') {
    return 'El servidor no respondió a tiempo.';
  }
  return 'No hay conexión con el servidor.';
}

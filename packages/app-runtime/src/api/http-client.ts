import { z } from 'zod';
import { ApiError } from './errors';
import { fetchWithTimeout } from './fetch-with-timeout';

export type ApiErrorPayload = { code: string; message: string };

export interface ApiClientConfig {
  baseUrl: string;
  defaultErrorSchema: z.ZodType<ApiErrorPayload>;
}

let apiClientConfig: ApiClientConfig | null = null;

export function configureApiClient(config: ApiClientConfig): void {
  apiClientConfig = config;
}

function getConfig(): ApiClientConfig {
  if (!apiClientConfig) {
    throw new Error(
      'apiClient no configurado: llama a configureApiClient en el arranque de la app.',
    );
  }
  return apiClientConfig;
}

export function getApiBaseUrl(): string {
  return getConfig().baseUrl;
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
  method: 'GET' | 'POST' | 'PUT';
  path: string;
  body?: unknown;
  signal?: AbortSignal;
  skipAuth?: boolean;
  skipRefreshOn401?: boolean;
}

const RetryInSecShape = z.object({ retry_in_sec: z.number().int().positive().optional() });

export function apiRequest<TResponse>(
  options: ApiRequestOptions,
  responseSchema: z.ZodType<TResponse, z.ZodTypeDef, unknown>,
  errorSchema?: z.ZodType<ApiErrorPayload>,
): Promise<TResponse> {
  return performRequest(
    options,
    responseSchema,
    errorSchema ?? getConfig().defaultErrorSchema,
    false,
  );
}

async function performRequest<TResponse>(
  options: ApiRequestOptions,
  responseSchema: z.ZodType<TResponse, z.ZodTypeDef, unknown>,
  errorSchema: z.ZodType<ApiErrorPayload>,
  isRetry: boolean,
): Promise<TResponse> {
  let res: Response;
  try {
    res = await fetchWithTimeout(`${getApiBaseUrl()}${options.path}`, {
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

  if (
    res.status === 401 &&
    !options.skipAuth &&
    !options.skipRefreshOn401 &&
    !isRetry &&
    authHandlers
  ) {
    const newToken = await authHandlers.refreshAndRetry();
    if (newToken) {
      return performRequest(options, responseSchema, errorSchema, true);
    }
    authHandlers.onSessionExpired();
  }

  const json: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    const retryAfterSec = parseRetryAfterSec(res.headers.get('Retry-After'));
    const parsedError = errorSchema.safeParse(json);
    if (parsedError.success) {
      const withBackoff = RetryInSecShape.safeParse(json);
      throw new ApiError(
        'http',
        parsedError.data.message,
        res.status,
        parsedError.data.code,
        withBackoff.success ? withBackoff.data.retry_in_sec : undefined,
        json,
        retryAfterSec,
      );
    }
    throw new ApiError(
      'http',
      `Error inesperado del servidor (${res.status}).`,
      res.status,
      undefined,
      undefined,
      json,
      retryAfterSec,
    );
  }

  const parsed = responseSchema.safeParse(json);
  if (!parsed.success) {
    throw new ApiError('validation', 'La respuesta del servidor no tiene el formato esperado.');
  }
  return parsed.data;
}

export function parseRetryAfterSec(header: string | null): number | undefined {
  if (header === null) return undefined;
  const seconds = Number(header.trim());
  return Number.isInteger(seconds) && seconds > 0 ? seconds : undefined;
}

function networkErrorMessage(e: unknown): string {
  if (e instanceof Error && e.name === 'AbortError') {
    return 'El servidor no respondió a tiempo.';
  }
  return 'No hay conexión con el servidor.';
}

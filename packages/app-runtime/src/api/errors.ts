export type ApiErrorKind = 'network' | 'http' | 'validation';

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;
  readonly code?: string;
  readonly retryInSec?: number;
  readonly body?: unknown;
  readonly retryAfterSec?: number;

  constructor(
    kind: ApiErrorKind,
    message: string,
    status?: number,
    code?: string,
    retryInSec?: number,
    body?: unknown,
    retryAfterSec?: number,
  ) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
    this.code = code;
    this.retryInSec = retryInSec;
    this.body = body;
    this.retryAfterSec = retryAfterSec;
  }
}

export function isNetworkError(error: unknown): boolean {
  return error instanceof ApiError && error.kind === 'network';
}

export function domainErrorCode(error: unknown): string | undefined {
  return error instanceof ApiError && error.kind === 'http' ? error.code : undefined;
}

export function retryInSecOf(error: unknown): number | undefined {
  return error instanceof ApiError ? error.retryInSec : undefined;
}

export function errorBodyOf(error: unknown): unknown {
  return error instanceof ApiError ? error.body : undefined;
}

export const RATE_LIMITED_STATUS = 429;
export const RATE_LIMITED_DEFAULT_WAIT_SEC = 10;

export function isRateLimitedError(error: unknown): boolean {
  return error instanceof ApiError && error.kind === 'http' && error.status === RATE_LIMITED_STATUS;
}

export function rateLimitWaitSec(error: unknown): number {
  const header = error instanceof ApiError ? error.retryAfterSec : undefined;
  return header !== undefined && header > 0 ? header : RATE_LIMITED_DEFAULT_WAIT_SEC;
}

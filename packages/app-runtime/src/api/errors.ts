export type ApiErrorKind = 'network' | 'http' | 'validation';

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;
  readonly code?: string;
  readonly retryInSec?: number;
  readonly body?: unknown;

  constructor(
    kind: ApiErrorKind,
    message: string,
    status?: number,
    code?: string,
    retryInSec?: number,
    body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
    this.code = code;
    this.retryInSec = retryInSec;
    this.body = body;
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

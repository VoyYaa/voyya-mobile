import { AuthError, AuthErrorCode, type ValidationIssue } from '@voyyaa/shared';

export type ChangePinFailure =
  | { kind: 'offline' }
  | { kind: 'expired' }
  | { kind: 'blocked'; retryInSec: number | undefined }
  | { kind: 'wrong_current' }
  | { kind: 'too_weak' }
  | { kind: 'invalid_data'; next: string | undefined; current: string | undefined }
  | { kind: 'server' };

export const PIN_CHANGE_REQUIRED_CODE = 'PIN_CHANGE_REQUIRED';

interface ErrorShape {
  kind?: unknown;
  status?: unknown;
  code?: unknown;
  retryInSec?: unknown;
  body?: unknown;
}

const INVALID_DATA_CODE = AuthErrorCode.enum.INVALID_DATA;

function classifyInvalidData(body: unknown): ChangePinFailure {
  const parsed = AuthError.safeParse(body);
  if (!parsed.success || parsed.data.details === undefined) return { kind: 'server' };
  const details: readonly ValidationIssue[] = parsed.data.details;
  const messageOf = (field: string): string | undefined =>
    details.find((detail) => detail.field === field)?.error;
  const next = messageOf('new_pin');
  const current = messageOf('current_pin');
  if (next === undefined && current === undefined) return { kind: 'server' };
  return { kind: 'invalid_data', next, current };
}

function asShape(error: unknown): ErrorShape | null {
  return typeof error === 'object' && error !== null ? (error as ErrorShape) : null;
}

export function isPinChangeRequiredError(error: unknown): boolean {
  const shape = asShape(error);
  return shape?.status === 403 && shape.code === PIN_CHANGE_REQUIRED_CODE;
}

export function classifyChangePinError(error: unknown): ChangePinFailure {
  const shape = asShape(error);
  if (shape === null) return { kind: 'server' };
  if (shape.kind === 'network') return { kind: 'offline' };
  switch (shape.code) {
    case 'TEMPORARY_PIN_EXPIRED':
      return { kind: 'expired' };
    case 'ACCOUNT_TEMPORARILY_BLOCKED':
      return {
        kind: 'blocked',
        retryInSec: typeof shape.retryInSec === 'number' ? shape.retryInSec : undefined,
      };
    case 'INVALID_CREDENTIALS':
      return { kind: 'wrong_current' };
    case 'PIN_TOO_WEAK':
      return { kind: 'too_weak' };
    case INVALID_DATA_CODE:
      return classifyInvalidData(shape.body);
    default:
      return { kind: 'server' };
  }
}

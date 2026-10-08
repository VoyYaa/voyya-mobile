export type ChangePinFailure =
  | { kind: 'offline' }
  | { kind: 'expired' }
  | { kind: 'blocked'; retryInSec: number | undefined }
  | { kind: 'wrong_current' }
  | { kind: 'too_weak' }
  | { kind: 'server' };

export const PIN_CHANGE_REQUIRED_CODE = 'PIN_CHANGE_REQUIRED';

interface ErrorShape {
  kind?: unknown;
  status?: unknown;
  code?: unknown;
  retryInSec?: unknown;
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
    default:
      return { kind: 'server' };
  }
}

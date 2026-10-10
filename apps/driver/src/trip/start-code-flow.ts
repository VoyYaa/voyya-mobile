export const RATE_LIMITED_FALLBACK_WAIT_SEC = 10;

const HTTP_TOO_MANY_REQUESTS = 429;
const HTTP_UNPROCESSABLE = 422;
const HTTP_CONFLICT = 409;
const CODE_INVALID = 'START_CODE_INVALID';
const CODE_REQUIRED = 'START_CODE_REQUIRED';
const CODE_BLOCKED = 'START_CODE_BLOCKED';

export type StartFailure =
  | { kind: 'invalid'; attemptsRemaining: number | null }
  | { kind: 'blocked' }
  | { kind: 'rate_limited'; waitSec: number }
  | { kind: 'uncertain' }
  | { kind: 'not_sent' }
  | { kind: 'changed' }
  | { kind: 'server' };

interface ApiFailureShape {
  kind?: unknown;
  status?: unknown;
  code?: unknown;
  retryAfterSec?: unknown;
  body?: unknown;
}

function asShape(error: unknown): ApiFailureShape {
  return typeof error === 'object' && error !== null ? (error as ApiFailureShape) : {};
}

function attemptsRemainingOf(body: unknown): number | null {
  if (typeof body !== 'object' || body === null) return null;
  const value = (body as { attempts_remaining?: unknown }).attempts_remaining;
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : null;
}

function waitSecOf(shape: ApiFailureShape): number {
  const header = shape.retryAfterSec;
  return typeof header === 'number' && header > 0 ? header : RATE_LIMITED_FALLBACK_WAIT_SEC;
}

export function isStartCodeRequiredError(error: unknown): boolean {
  const shape = asShape(error);
  return shape.status === HTTP_UNPROCESSABLE && shape.code === CODE_REQUIRED;
}

export function classifyStartFailure(error: unknown): StartFailure {
  const shape = asShape(error);
  if (shape.kind === 'network' || shape.kind === 'validation') return { kind: 'uncertain' };
  if (shape.status === HTTP_TOO_MANY_REQUESTS) {
    return { kind: 'rate_limited', waitSec: waitSecOf(shape) };
  }
  if (shape.status === HTTP_UNPROCESSABLE && shape.code === CODE_INVALID) {
    return { kind: 'invalid', attemptsRemaining: attemptsRemainingOf(shape.body) };
  }
  if (shape.status === HTTP_CONFLICT && shape.code === CODE_BLOCKED) return { kind: 'blocked' };
  if (shape.status === HTTP_CONFLICT) return { kind: 'changed' };
  if (shape.status === 403 || shape.status === 404) return { kind: 'changed' };
  return { kind: 'server' };
}

export interface StartAttemptSnapshot {
  attemptsRemaining: number | null;
}

export interface StartTripSnapshot {
  status: string;
  start_blocked: boolean;
  start_attempts_remaining: number | null;
}

export type UncertainResolution =
  | { kind: 'started' }
  | { kind: 'blocked' }
  | { kind: 'invalid'; attemptsRemaining: number }
  | { kind: 'not_sent' }
  | { kind: 'unknown' };

export function resolveUncertainStart(
  before: StartAttemptSnapshot,
  after: StartTripSnapshot | null,
): UncertainResolution {
  if (after === null) return { kind: 'unknown' };
  if (after.status === 'in_progress') return { kind: 'started' };
  if (after.start_blocked) return { kind: 'blocked' };
  const remaining = after.start_attempts_remaining;
  if (
    remaining !== null &&
    before.attemptsRemaining !== null &&
    remaining < before.attemptsRemaining
  ) {
    return { kind: 'invalid', attemptsRemaining: remaining };
  }
  return { kind: 'not_sent' };
}

export type StartSheetPhase = 'editing' | 'verifying' | 'checking' | 'success';

export type StartSheetMessage =
  | { kind: 'offline' }
  | { kind: 'rate_limited' }
  | { kind: 'invalid'; attemptsRemaining: number | null }
  | { kind: 'checking' }
  | { kind: 'not_sent' }
  | { kind: 'server' }
  | { kind: 'prior_attempts'; attemptsRemaining: number };

export interface StartSheetInput {
  digits: string;
  length: number;
  maxAttempts: number;
  phase: StartSheetPhase;
  failure: StartFailure | null;
  errorShake: boolean;
  attemptsRemaining: number | null;
  online: boolean;
  rateLimitedForSec: number;
}

export interface StartSheetView {
  otpStatus: 'editing' | 'verifying' | 'error' | 'success';
  message: StartSheetMessage | null;
  lastAttemptWarning: boolean;
  confirmEnabled: boolean;
  fieldDisabled: boolean;
  busy: boolean;
  dismissible: boolean;
}

function messageForFailure(failure: StartFailure): StartSheetMessage | null {
  switch (failure.kind) {
    case 'invalid':
      return { kind: 'invalid', attemptsRemaining: failure.attemptsRemaining };
    case 'rate_limited':
      return { kind: 'rate_limited' };
    case 'uncertain':
    case 'not_sent':
      return { kind: 'not_sent' };
    case 'server':
      return { kind: 'server' };
    case 'blocked':
    case 'changed':
      return null;
  }
}

function pickMessage(input: StartSheetInput): StartSheetMessage | null {
  if (input.phase === 'checking') return { kind: 'checking' };
  if (input.phase === 'verifying' || input.phase === 'success') return null;
  if (input.rateLimitedForSec > 0) return { kind: 'rate_limited' };
  if (input.failure) {
    const fromFailure = messageForFailure(input.failure);
    if (fromFailure) return fromFailure;
  }
  if (!input.online) return { kind: 'offline' };
  const remaining = input.attemptsRemaining;
  if (remaining !== null && remaining > 0 && remaining < input.maxAttempts) {
    return { kind: 'prior_attempts', attemptsRemaining: remaining };
  }
  return null;
}

export function startSheetView(input: StartSheetInput): StartSheetView {
  const working = input.phase === 'verifying' || input.phase === 'checking';
  const otpStatus = working
    ? 'verifying'
    : input.phase === 'success'
      ? 'success'
      : input.errorShake
        ? 'error'
        : 'editing';
  const hasAttempts = input.attemptsRemaining === null || input.attemptsRemaining > 0;

  return {
    otpStatus,
    message: pickMessage(input),
    lastAttemptWarning:
      input.attemptsRemaining === 1 && input.phase === 'editing' && !input.errorShake,
    confirmEnabled:
      input.phase === 'editing' &&
      input.digits.length === input.length &&
      input.online &&
      input.rateLimitedForSec === 0 &&
      hasAttempts,
    fieldDisabled: input.phase !== 'editing',
    busy: working,
    dismissible: !working,
  };
}

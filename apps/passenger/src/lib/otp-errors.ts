export type OtpVerifyFailure =
  | { kind: 'offline' }
  | { kind: 'incorrect' }
  | { kind: 'expired' }
  | { kind: 'max_attempts' }
  | { kind: 'suspended' }
  | { kind: 'throttled' }
  | { kind: 'server' };

export type OtpRequestFailure =
  | { kind: 'offline' }
  | { kind: 'rate_limited'; retryInSec: number | null }
  | { kind: 'throttled' }
  | { kind: 'invalid_phone' }
  | { kind: 'server' };

export type OtpStep = 'verify' | 'request';

interface FailureSignal {
  kind: string;
  status: number | undefined;
  code: string | undefined;
  retryInSec: number | undefined;
}

const HTTP_BAD_REQUEST = 400;
const HTTP_UNAUTHORIZED = 401;
const HTTP_FORBIDDEN = 403;
const HTTP_GONE = 410;
const HTTP_TOO_MANY_REQUESTS = 429;

function signalOf(error: unknown): FailureSignal | null {
  if (typeof error !== 'object' || error === null) return null;
  const { kind, status, code, retryInSec } = error as Record<string, unknown>;
  if (typeof kind !== 'string') return null;
  return {
    kind,
    status: typeof status === 'number' ? status : undefined,
    code: typeof code === 'string' ? code : undefined,
    retryInSec: typeof retryInSec === 'number' ? retryInSec : undefined,
  };
}

function is(signal: FailureSignal, status: number, code: string | undefined): boolean {
  return signal.kind === 'http' && signal.status === status && signal.code === code;
}

function knownWait(retryInSec: number | undefined): number | null {
  return retryInSec !== undefined && retryInSec > 0 ? retryInSec : null;
}

function classifyVerify(signal: FailureSignal): OtpVerifyFailure {
  if (is(signal, HTTP_UNAUTHORIZED, 'OTP_INVALID')) return { kind: 'incorrect' };
  if (is(signal, HTTP_GONE, 'OTP_EXPIRED')) return { kind: 'expired' };
  if (is(signal, HTTP_TOO_MANY_REQUESTS, 'OTP_MAX_ATTEMPTS')) return { kind: 'max_attempts' };
  if (is(signal, HTTP_TOO_MANY_REQUESTS, undefined)) return { kind: 'throttled' };
  if (is(signal, HTTP_FORBIDDEN, 'ACCOUNT_SUSPENDED')) return { kind: 'suspended' };
  return { kind: 'server' };
}

function classifyRequest(signal: FailureSignal): OtpRequestFailure {
  if (is(signal, HTTP_TOO_MANY_REQUESTS, 'OTP_RATE_LIMIT')) {
    return { kind: 'rate_limited', retryInSec: knownWait(signal.retryInSec) };
  }
  if (is(signal, HTTP_TOO_MANY_REQUESTS, undefined)) return { kind: 'throttled' };
  if (is(signal, HTTP_BAD_REQUEST, 'INVALID_DATA')) return { kind: 'invalid_phone' };
  return { kind: 'server' };
}

export function classifyOtpFailure(error: unknown, step: 'verify'): OtpVerifyFailure;
export function classifyOtpFailure(error: unknown, step: 'request'): OtpRequestFailure;
export function classifyOtpFailure(
  error: unknown,
  step: OtpStep,
): OtpVerifyFailure | OtpRequestFailure {
  const signal = signalOf(error);
  if (signal === null) return { kind: 'server' };
  if (signal.kind === 'network') return { kind: 'offline' };
  return step === 'verify' ? classifyVerify(signal) : classifyRequest(signal);
}

import type { TripRequestStatus } from '@voyyaa/shared';
import { recordValidity, type RecordProbe, type StartCodeRecord } from './start-code-record';

export type ServerProbe =
  | { kind: 'pending' }
  | { kind: 'answered'; trip: TripRequestStatus | null }
  | { kind: 'failed'; reason: 'offline' | 'error' };

export type RestoreMode = 'offline' | 'error' | 'checking';

export interface ColdStartInput {
  session: 'hydrating' | 'authenticated' | 'guest';
  userId: number | null;
  server: ServerProbe;
  record: RecordProbe;
  slowSignal: boolean;
  now: number;
  ttlMs: number;
}

export type ColdStartDecision =
  | { kind: 'idle' }
  | { kind: 'wait' }
  | { kind: 'server'; trip: TripRequestStatus | null }
  | { kind: 'restore'; record: StartCodeRecord; mode: RestoreMode }
  | { kind: 'failed'; reason: 'offline' | 'error' };

export interface ColdStartResult {
  decision: ColdStartDecision;
  discardRecord: boolean;
}

export interface ServerProbeInput {
  data: TripRequestStatus | null | undefined;
  isError: boolean;
  networkError: boolean;
  offline: boolean;
}

export function serverProbe({
  data,
  isError,
  networkError,
  offline,
}: ServerProbeInput): ServerProbe {
  if (data !== undefined) return { kind: 'answered', trip: data };
  if (offline || (isError && networkError)) return { kind: 'failed', reason: 'offline' };
  return isError ? { kind: 'failed', reason: 'error' } : { kind: 'pending' };
}

function withoutUsableRecord(server: ServerProbe, discardRecord: boolean): ColdStartResult {
  const decision: ColdStartDecision =
    server.kind === 'failed' ? { kind: 'failed', reason: server.reason } : { kind: 'wait' };
  return { decision, discardRecord };
}

function restoreMode(server: ServerProbe): RestoreMode {
  return server.kind === 'failed' ? server.reason : 'checking';
}

export function resolveColdStart(input: ColdStartInput): ColdStartResult {
  const { session, userId, server, record, slowSignal, now, ttlMs } = input;

  if (session === 'hydrating') return { decision: { kind: 'idle' }, discardRecord: false };
  if (session === 'guest') {
    const hasRecord = record.kind !== 'absent' && record.kind !== 'loading';
    return { decision: { kind: 'idle' }, discardRecord: hasRecord };
  }
  if (server.kind === 'answered') {
    return { decision: { kind: 'server', trip: server.trip }, discardRecord: false };
  }
  if (server.kind === 'pending' && !slowSignal) {
    return { decision: { kind: 'wait' }, discardRecord: false };
  }
  if (record.kind === 'loading') return { decision: { kind: 'wait' }, discardRecord: false };
  if (record.kind === 'absent') return withoutUsableRecord(server, false);
  if (record.kind === 'invalid') return withoutUsableRecord(server, true);

  const usable =
    userId !== null && recordValidity(record.record, { userId, now, ttlMs }) === 'valid';
  if (!usable) return withoutUsableRecord(server, true);
  return {
    decision: { kind: 'restore', record: record.record, mode: restoreMode(server) },
    discardRecord: false,
  };
}

export type StartupPhase = 'idle' | 'checking' | 'error' | 'offline' | 'done';

export function startupPhaseOf(
  decision: ColdStartDecision,
  flags: { skipped: boolean; routed: boolean },
): StartupPhase {
  if (decision.kind === 'idle') return 'idle';
  if (flags.skipped || flags.routed) return 'done';
  switch (decision.kind) {
    case 'server':
    case 'restore':
      return 'done';
    case 'failed':
      return decision.reason;
    case 'wait':
      return 'checking';
  }
}

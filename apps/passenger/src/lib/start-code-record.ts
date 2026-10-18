import { START_CODE_LENGTH, type StartCodeState, type TripRequestStatus } from '@voyyaa/shared';

export const START_CODE_KEY = 'voyya_start_code';
export const START_CODE_RECORD_VERSION = 2;

export interface StartCodeRecord {
  version: typeof START_CODE_RECORD_VERSION;
  trip_request_id: number;
  user_id: number;
  start_code: string;
  saved_at: number;
}

export type StoredStartCode =
  { kind: 'absent' } | { kind: 'invalid' } | { kind: 'present'; record: StartCodeRecord };

export type RecordProbe = { kind: 'loading' } | StoredStartCode;

export type RecordValidity = 'valid' | 'other_user' | 'expired' | 'future';

export interface ServerStartCode {
  trip_request_id: number;
  start_code: string | null;
  start_code_state: StartCodeState;
}

export type RecordAction =
  { kind: 'keep' } | { kind: 'clear' } | { kind: 'write'; record: StartCodeRecord };

export interface RecordValidityContext {
  userId: number;
  now: number;
  ttlMs: number;
}

export interface NextRecordContext {
  userId: number;
  now: number;
  allowCreate: boolean;
  refreshMs: number;
}

export interface UsableRecordContext {
  tripRequestId: number | null;
  userId: number | null;
  now: number;
  ttlMs: number;
}

const CODE_PATTERN = new RegExp(`^[0-9]{${START_CODE_LENGTH}}$`);
const KEEP: RecordAction = { kind: 'keep' };
const CLEAR: RecordAction = { kind: 'clear' };

export function isStartCode(value: unknown): value is string {
  return typeof value === 'string' && CODE_PATTERN.test(value);
}

function toRecord(value: unknown): StartCodeRecord | null {
  if (typeof value !== 'object' || value === null) return null;
  const candidate = value as Record<string, unknown>;
  const tripRequestId = candidate.trip_request_id;
  const userId = candidate.user_id;
  const startCode = candidate.start_code;
  const savedAt = candidate.saved_at;
  if (candidate.version !== START_CODE_RECORD_VERSION) return null;
  if (typeof tripRequestId !== 'number' || !Number.isInteger(tripRequestId)) return null;
  if (typeof userId !== 'number' || !Number.isInteger(userId)) return null;
  if (!isStartCode(startCode)) return null;
  if (typeof savedAt !== 'number' || !Number.isFinite(savedAt)) return null;
  return {
    version: START_CODE_RECORD_VERSION,
    trip_request_id: tripRequestId,
    user_id: userId,
    start_code: startCode,
    saved_at: savedAt,
  };
}

export function parseStartCodeRecord(raw: string | null): StoredStartCode {
  if (raw === null) return { kind: 'absent' };
  try {
    const record = toRecord(JSON.parse(raw));
    return record === null ? { kind: 'invalid' } : { kind: 'present', record };
  } catch {
    return { kind: 'invalid' };
  }
}

export function serializeStartCodeRecord(record: StartCodeRecord): string {
  return JSON.stringify({
    version: START_CODE_RECORD_VERSION,
    trip_request_id: record.trip_request_id,
    user_id: record.user_id,
    start_code: record.start_code,
    saved_at: record.saved_at,
  });
}

export function recordValidity(
  record: StartCodeRecord,
  { userId, now, ttlMs }: RecordValidityContext,
): RecordValidity {
  if (record.user_id !== userId) return 'other_user';
  if (record.saved_at > now) return 'future';
  return now - record.saved_at >= ttlMs ? 'expired' : 'valid';
}

export function msUntilExpiry(record: StartCodeRecord, now: number, ttlMs: number): number {
  return Math.max(0, record.saved_at + ttlMs - now);
}

function activeCodeOf(server: ServerStartCode | null): string | null {
  if (server === null || server.start_code_state !== 'active') return null;
  return isStartCode(server.start_code) ? server.start_code : null;
}

export function nextStartCodeRecord(
  current: StartCodeRecord | null,
  server: ServerStartCode | null,
  context: NextRecordContext,
): RecordAction {
  const code = activeCodeOf(server);
  if (server === null || code === null) return current === null ? KEEP : CLEAR;

  const fresh: StartCodeRecord = {
    version: START_CODE_RECORD_VERSION,
    trip_request_id: server.trip_request_id,
    user_id: context.userId,
    start_code: code,
    saved_at: context.now,
  };
  const sameTrip =
    current !== null &&
    current.user_id === context.userId &&
    current.trip_request_id === server.trip_request_id;

  if (!sameTrip) {
    if (context.allowCreate) return { kind: 'write', record: fresh };
    return current === null ? KEEP : CLEAR;
  }
  if (current.start_code !== code) return { kind: 'write', record: fresh };

  const age = context.now - current.saved_at;
  return age >= context.refreshMs || age < 0 ? { kind: 'write', record: fresh } : KEEP;
}

export function toServerStartCode(
  trip: Pick<TripRequestStatus, 'trip_request_id' | 'start_code' | 'start_code_state'>,
): ServerStartCode {
  return {
    trip_request_id: trip.trip_request_id,
    start_code: trip.start_code,
    start_code_state: trip.start_code_state,
  };
}

export function recordBelongsToAnotherTrip(
  probe: RecordProbe,
  tripRequestId: number | null,
): boolean {
  return (
    probe.kind === 'present' &&
    tripRequestId !== null &&
    probe.record.trip_request_id !== tripRequestId
  );
}

export function usableRecord(
  probe: RecordProbe,
  { tripRequestId, userId, now, ttlMs }: UsableRecordContext,
): StartCodeRecord | null {
  if (probe.kind !== 'present' || tripRequestId === null || userId === null) return null;
  if (probe.record.trip_request_id !== tripRequestId) return null;
  return recordValidity(probe.record, { userId, now, ttlMs }) === 'valid' ? probe.record : null;
}

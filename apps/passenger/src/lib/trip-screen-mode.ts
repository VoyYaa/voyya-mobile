import { savedTripMode, type SavedTripMode } from './saved-trip-mode';
import type { StartCodeRecord } from './start-code-record';

export type TripScreenMode =
  | { kind: 'not_found' }
  | { kind: 'server' }
  | { kind: 'restored'; record: StartCodeRecord; note: SavedTripMode }
  | { kind: 'loading' }
  | { kind: 'empty'; reason: 'offline' | 'error' };

export interface TripScreenModeInput {
  hasFreshData: boolean;
  isError: boolean;
  notOwnedOrMissing: boolean;
  offline: boolean;
  retrying: boolean;
  lastAttemptFailed: boolean;
  restoredRecord: StartCodeRecord | null;
  enteredFromSaved: boolean;
}

export function tripScreenMode(input: TripScreenModeInput): TripScreenMode {
  const { hasFreshData, isError, notOwnedOrMissing, offline, retrying } = input;
  const { restoredRecord, enteredFromSaved } = input;
  const failed = isError || input.lastAttemptFailed;

  if (isError && notOwnedOrMissing) return { kind: 'not_found' };
  if (hasFreshData) return { kind: 'server' };
  if (restoredRecord !== null && (offline || failed || enteredFromSaved)) {
    const note = savedTripMode({
      networkStatus: offline ? 'offline' : 'online',
      lastAttemptFailed: failed,
      retrying,
    });
    return { kind: 'restored', record: restoredRecord, note };
  }
  if (offline || failed) return { kind: 'empty', reason: offline ? 'offline' : 'error' };
  return { kind: 'loading' };
}

export interface CanRestorePickupInput {
  restoredRecord: StartCodeRecord | null;
  tripRequestId: number | null;
  hasFreshData: boolean;
}

export function canRestorePickup({
  restoredRecord,
  tripRequestId,
  hasFreshData,
}: CanRestorePickupInput): boolean {
  if (tripRequestId === null) return false;
  if (hasFreshData) return true;
  return restoredRecord !== null && restoredRecord.trip_request_id === tripRequestId;
}

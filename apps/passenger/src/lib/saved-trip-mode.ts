export type SavedTripMode = 'offline' | 'checking' | 'error';

export interface SavedTripModeInput {
  networkStatus: 'online' | 'offline';
  lastAttemptFailed: boolean;
  retrying: boolean;
}

export function savedTripMode({
  networkStatus,
  lastAttemptFailed,
  retrying,
}: SavedTripModeInput): SavedTripMode {
  if (networkStatus === 'offline') return 'offline';
  if (retrying) return 'checking';
  return lastAttemptFailed ? 'error' : 'checking';
}

export function modeEntryAnnouncement(
  previous: SavedTripMode | null,
  next: SavedTripMode,
): 'offline' | 'error' | null {
  if (previous === null || previous === next) return null;
  return next === 'checking' ? null : next;
}

export function retryFeedbackRemainingMs(elapsedMs: number, minMs: number): number {
  return Math.min(minMs, Math.max(0, minMs - elapsedMs));
}

export function nextLastAttemptFailed(
  previous: boolean,
  signals: { isError: boolean; cameBackOnline: boolean },
): boolean {
  if (signals.cameBackOnline) return false;
  return previous || signals.isError;
}

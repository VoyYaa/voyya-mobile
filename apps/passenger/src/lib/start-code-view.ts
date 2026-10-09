export type StartCodeNote = 'online' | 'saved_offline' | 'saved_refresh_failed';

export type StartCodeCardView =
  | { kind: 'hidden' }
  | { kind: 'loading' }
  | { kind: 'code'; code: string; note: StartCodeNote }
  | { kind: 'empty'; reason: 'offline' | 'error' }
  | { kind: 'blocked' };

export interface StartCodeViewInput {
  response: { start_code: string | null; start_code_state: string } | null;
  saved: string | null;
  offline: boolean;
  refreshFailed: boolean;
}

function noteFor(offline: boolean, refreshFailed: boolean): StartCodeNote {
  if (offline) return 'saved_offline';
  return refreshFailed ? 'saved_refresh_failed' : 'online';
}

export function startCodeCardView({
  response,
  saved,
  offline,
  refreshFailed,
}: StartCodeViewInput): StartCodeCardView {
  if (response === null) {
    if (saved !== null) return { kind: 'code', code: saved, note: noteFor(offline, true) };
    if (offline) return { kind: 'empty', reason: 'offline' };
    return refreshFailed ? { kind: 'empty', reason: 'error' } : { kind: 'loading' };
  }

  if (response.start_code_state === 'blocked') return { kind: 'blocked' };
  if (response.start_code_state !== 'active') return { kind: 'hidden' };

  if (response.start_code !== null) {
    return { kind: 'code', code: response.start_code, note: noteFor(offline, refreshFailed) };
  }
  if (saved !== null) return { kind: 'code', code: saved, note: noteFor(offline, true) };
  return { kind: 'empty', reason: offline ? 'offline' : 'error' };
}

export function spokenDigits(code: string): string {
  return code.split('').join(', ');
}

export function spokenPlate(plate: string): string {
  return plate
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase()
    .split('')
    .join(', ');
}

export function startCodeShouldAnnounceStart(
  previous: StartCodeCardView['kind'] | null,
  uiIsInProgress: boolean,
): boolean {
  return uiIsInProgress && (previous === 'code' || previous === 'blocked');
}

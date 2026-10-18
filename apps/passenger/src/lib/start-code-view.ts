import { savedStartCodeCopy } from '../copy/saved-trip-copy';
import { formatClockTime } from './driver-tracking-presentation';

export type StartCodeNote = 'online' | 'saved_offline' | 'saved_refresh_failed' | 'saved_checking';

export type StartCodeCardView =
  | { kind: 'hidden' }
  | { kind: 'loading' }
  | { kind: 'code'; code: string; note: StartCodeNote; savedAt: number | null }
  | { kind: 'empty'; reason: 'offline' | 'error' }
  | { kind: 'blocked' };

export interface StartCodeViewInput {
  response: { start_code: string | null; start_code_state: string } | null;
  saved: string | null;
  offline: boolean;
  refreshFailed: boolean;
  savedAt?: number | null;
}

export interface StartCodeStatusLine {
  glyph: 'offline' | 'checking' | 'clock';
  title: string;
  detail: string | null;
  plain: boolean;
}

function noteFor(offline: boolean, refreshFailed: boolean): StartCodeNote {
  if (offline) return 'saved_offline';
  return refreshFailed ? 'saved_refresh_failed' : 'online';
}

function savedNoteFor(offline: boolean, refreshFailed: boolean): StartCodeNote {
  if (offline) return 'saved_offline';
  return refreshFailed ? 'saved_refresh_failed' : 'saved_checking';
}

export function startCodeCardView({
  response,
  saved,
  offline,
  refreshFailed,
  savedAt = null,
}: StartCodeViewInput): StartCodeCardView {
  if (response === null) {
    if (saved !== null) {
      return { kind: 'code', code: saved, note: savedNoteFor(offline, refreshFailed), savedAt };
    }
    if (offline) return { kind: 'empty', reason: 'offline' };
    return refreshFailed ? { kind: 'empty', reason: 'error' } : { kind: 'loading' };
  }

  if (response.start_code_state === 'blocked') return { kind: 'blocked' };
  if (response.start_code_state !== 'active') return { kind: 'hidden' };

  if (response.start_code !== null) {
    return {
      kind: 'code',
      code: response.start_code,
      note: noteFor(offline, refreshFailed),
      savedAt: null,
    };
  }
  if (saved !== null) {
    return { kind: 'code', code: saved, note: noteFor(offline, true), savedAt: null };
  }
  return { kind: 'empty', reason: offline ? 'offline' : 'error' };
}

export function startCodeStatusLine(
  note: StartCodeNote,
  savedAt: number | null,
): StartCodeStatusLine | null {
  if (note === 'online') return null;
  const detail =
    savedAt === null ? null : savedStartCodeCopy.savedAt(formatClockTime(new Date(savedAt)));

  if (note === 'saved_offline') {
    const title =
      detail === null ? savedStartCodeCopy.openOffline : savedStartCodeCopy.offlineTitle;
    return { glyph: 'offline', title, detail, plain: detail === null };
  }
  if (note === 'saved_checking') {
    return {
      glyph: 'checking',
      title: savedStartCodeCopy.checkingTitle,
      detail,
      plain: detail === null,
    };
  }
  const title =
    detail === null ? savedStartCodeCopy.openRefreshFailed : savedStartCodeCopy.errorTitle;
  return { glyph: 'clock', title, detail, plain: detail === null };
}

export function codeChangedAfterRestore(
  shown: string | null,
  response: { start_code: string | null; start_code_state: string },
): boolean {
  if (shown === null || response.start_code_state !== 'active') return false;
  return response.start_code !== null && response.start_code !== shown;
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

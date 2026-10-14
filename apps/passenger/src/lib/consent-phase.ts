import type { ConsentStatus } from '@voyyaa/shared';
import { isSessionFresh } from './session-freshness';

export type LocationConsentPhase =
  'checking' | 'confirmed' | 'needs_notice' | 'declined' | 'unknown';

export interface ConsentGateInput {
  status: ConsentStatus | null;
  localConfirmed: boolean | null;
  failed: boolean;
  offline: boolean;
}

export function phaseOfStatus(status: ConsentStatus): LocationConsentPhase {
  if (status.state === 'granted' && !status.requires_acceptance) return 'confirmed';
  if (status.state === 'revoked') return 'declined';
  return 'needs_notice';
}

export function freshConsentStatus(
  status: ConsentStatus | undefined,
  dataUpdatedAt: number,
  sessionStartedAt: number | null,
): ConsentStatus | null {
  if (status === undefined || !isSessionFresh(dataUpdatedAt, sessionStartedAt)) return null;
  return status;
}

export function consentGatePhase({
  status,
  localConfirmed,
  failed,
  offline,
}: ConsentGateInput): LocationConsentPhase {
  if (status !== null) return phaseOfStatus(status);
  if (localConfirmed === null) return 'checking';
  if (localConfirmed) return 'confirmed';
  return failed || offline ? 'unknown' : 'checking';
}

export interface NoticeToastInput {
  pending: boolean;
  sheetOpen: boolean;
  phase: LocationConsentPhase;
}

export function noticeToastVisible({ pending, sheetOpen, phase }: NoticeToastInput): boolean {
  return pending && !sheetOpen && phase !== 'checking';
}

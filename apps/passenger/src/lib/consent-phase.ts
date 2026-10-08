import type { ConsentStatus } from '@voyyaa/shared';

export type LocationConsentPhase =
  'checking' | 'confirmed' | 'needs_notice' | 'declined' | 'unknown';

export function phaseOfStatus(status: ConsentStatus): LocationConsentPhase {
  if (status.state === 'granted' && !status.requires_acceptance) return 'confirmed';
  if (status.state === 'revoked') return 'declined';
  return 'needs_notice';
}

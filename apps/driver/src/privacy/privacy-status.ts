export type ConsentView = 'shared' | 'new_notice' | 'revoked' | 'none';

export interface ConsentViewInput {
  state: 'granted' | 'revoked' | 'none';
  requires_acceptance: boolean;
}

const NOTICE_TIME_ZONE = 'America/Bogota';

export function consentView({ state, requires_acceptance }: ConsentViewInput): ConsentView {
  if (state === 'granted') return requires_acceptance ? 'new_notice' : 'shared';
  return state === 'revoked' ? 'revoked' : 'none';
}

export function canRevoke(state: ConsentViewInput['state']): boolean {
  return state === 'granted';
}

export function formatNoticeDate(iso: string | null): string | null {
  if (iso === null) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: NOTICE_TIME_ZONE,
  }).format(date);
}

export function isMailableAddress(value: string): boolean {
  return /^[^\s@[\]]+@[^\s@[\]]+\.[^\s@[\]]+$/.test(value);
}

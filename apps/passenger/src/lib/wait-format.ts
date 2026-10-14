import { RATE_LIMIT_LONG_WAIT_SEC } from '../constants/parameters';
import { authCopy } from '../copy/auth-copy';

const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;

export interface WaitCardText {
  body: string;
  spokenBody: string;
  ticking: boolean;
}

function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

export function formatWaitHours(remainingSec: number): string {
  const hours = Math.ceil(remainingSec / SECONDS_PER_HOUR);
  return hours === 1 ? '1 hora' : `unas ${hours} horas`;
}

export function waitSpoken(remainingSec: number): string {
  const seconds = Math.max(0, Math.ceil(remainingSec));
  if (seconds < SECONDS_PER_MINUTE) return plural(seconds, 'segundo', 'segundos');
  if (seconds < SECONDS_PER_HOUR) {
    return plural(Math.ceil(seconds / SECONDS_PER_MINUTE), 'minuto', 'minutos');
  }
  return formatWaitHours(seconds);
}

export function waitCardText(
  remainingSec: number | null,
  formatClock: (seconds: number) => string,
): WaitCardText {
  if (remainingSec === null) {
    const body = authCopy.rateLimitBodyGeneric;
    return { body, spokenBody: body, ticking: false };
  }
  if (remainingSec >= RATE_LIMIT_LONG_WAIT_SEC) {
    const body = authCopy.rateLimitLongBody(formatWaitHours(remainingSec));
    return { body, spokenBody: body, ticking: false };
  }
  return {
    body: authCopy.rateLimitWait(formatClock(remainingSec)),
    spokenBody: authCopy.rateLimitWait(waitSpoken(remainingSec)),
    ticking: true,
  };
}

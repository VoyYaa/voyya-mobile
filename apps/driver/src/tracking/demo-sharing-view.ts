import type { SharingIndicator } from './sharing-machine';

export type SharingDisplayKind = SharingIndicator['kind'] | 'demo_active';

const DEMO_HIDDEN_KINDS: ReadonlySet<SharingIndicator['kind']> = new Set([
  'location_issue',
  'precise_needed',
  'no_fix',
  'active',
]);

export function sharingDisplayKind(indicator: SharingIndicator, demo: boolean): SharingDisplayKind {
  return demo && DEMO_HIDDEN_KINDS.has(indicator.kind) ? 'demo_active' : indicator.kind;
}

export function showNotificationsOff(notificationsOff: boolean, demo: boolean): boolean {
  return notificationsOff && !demo;
}

export function showIosForegroundNote(
  iosForegroundOnly: boolean,
  display: SharingDisplayKind,
  isIos: boolean,
): boolean {
  return iosForegroundOnly || (display === 'demo_active' && isIos);
}

export type StatusBannerTone = 'info' | 'warning' | 'danger';

export type StatusBannerIcon = 'pin' | 'clock' | 'alert' | 'bell' | 'bell_off' | 'spinner';

export type StatusBannerRole = 'alert' | 'status';

export type BannerKind = 'offline' | 'location' | 'notice';

export interface BannerA11y {
  role: StatusBannerRole;
  liveRegion: 'assertive' | 'polite';
}

const BANNER_PRIORITY: readonly BannerKind[] = ['offline', 'location', 'notice'];

export function resolveBannerA11y(
  tone: StatusBannerTone,
  role?: StatusBannerRole,
): BannerA11y {
  const resolved: StatusBannerRole = role ?? (tone === 'danger' ? 'alert' : 'status');
  return { role: resolved, liveRegion: resolved === 'alert' ? 'assertive' : 'polite' };
}

export function selectBanner(active: readonly BannerKind[]): BannerKind | null {
  return BANNER_PRIORITY.find((kind) => active.includes(kind)) ?? null;
}

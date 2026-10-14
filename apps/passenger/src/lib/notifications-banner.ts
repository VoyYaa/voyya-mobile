import type { PushPermission, PushRegistrationStatus } from '@voyyaa/app-runtime';
import { notificationsCopy } from '../copy/notifications-copy';
import type { TripPhase } from './trip-phase';

export const BANNER_CONFIRMED_VISIBLE_MS = 4000;

export type NotificationsBannerVariant =
  'askable' | 'blocked' | 'failed' | 'offline' | 'unsupported' | 'activating' | 'confirmed';

export interface BannerResolutionInput {
  phase: TripPhase;
  dismissed: boolean;
  permission: PushPermission | 'unknown';
  registration: PushRegistrationStatus;
  activating: boolean;
  confirmed: boolean;
  promptActive: boolean;
}

const BANNER_PHASES: readonly TripPhase[] = ['searching', 'assigned', 'en_route'];

export function resolveBannerVariant(
  input: BannerResolutionInput,
): NotificationsBannerVariant | null {
  if (!BANNER_PHASES.includes(input.phase) || input.dismissed) return null;
  if (input.permission === 'unknown') return null;
  if (input.permission === 'unsupported') return 'unsupported';
  if (input.activating) return input.promptActive ? null : 'activating';

  switch (input.permission) {
    case 'undetermined':
      return input.promptActive ? null : 'askable';
    case 'askable':
      return 'askable';
    case 'blocked':
      return 'blocked';
    case 'granted':
      if (input.registration === 'failed') return 'failed';
      if (input.registration === 'pending_offline') return 'offline';
      return input.registration === 'registered' && input.confirmed ? 'confirmed' : null;
  }
}

const INACTIVE_PERMISSIONS: ReadonlyArray<PushPermission | 'unknown'> = [
  'undetermined',
  'askable',
  'blocked',
];

export function isPermissionInactive(permission: PushPermission | 'unknown'): boolean {
  return INACTIVE_PERMISSIONS.includes(permission);
}

export function shouldShowConfirmation(
  inactiveSeen: boolean,
  permission: PushPermission | 'unknown',
  registration: PushRegistrationStatus,
): boolean {
  return inactiveSeen && permission === 'granted' && registration === 'registered';
}

export function shouldAnnounceBanner(input: {
  previous: NotificationsBannerVariant | null;
  next: NotificationsBannerVariant | null;
  decisionPending: boolean;
}): boolean {
  if (input.next === null || input.next === input.previous) return false;
  return input.decisionPending || input.previous === 'activating';
}

export type BannerGlyph = 'bell' | 'bell_off' | 'spinner';

export interface BannerPresentation {
  glyph: BannerGlyph;
  title: string;
  body: string | null;
  actionLabel: string | null;
  actionHint: string | null;
  dismissible: boolean;
  accessibilityLabel: string;
}

const copy = notificationsCopy.banner;

function present(parts: Omit<BannerPresentation, 'accessibilityLabel'>): BannerPresentation {
  const label = parts.body === null ? parts.title : `${parts.title}. ${parts.body}`;
  return { ...parts, accessibilityLabel: label };
}

export function bannerPresentation(variant: NotificationsBannerVariant): BannerPresentation {
  switch (variant) {
    case 'askable':
      return present({
        glyph: 'bell_off',
        title: copy.askable.title,
        body: copy.keepOpen,
        actionLabel: copy.askable.action,
        actionHint: null,
        dismissible: true,
      });
    case 'blocked':
      return present({
        glyph: 'bell_off',
        title: copy.blocked.title,
        body: copy.keepOpen,
        actionLabel: copy.blocked.action,
        actionHint: copy.blocked.actionHint,
        dismissible: true,
      });
    case 'failed':
      return present({
        glyph: 'bell_off',
        title: copy.failed.title,
        body: copy.keepOpen,
        actionLabel: copy.failed.action,
        actionHint: null,
        dismissible: true,
      });
    case 'offline':
      return present({
        glyph: 'bell_off',
        title: copy.offline.title,
        body: copy.offline.body,
        actionLabel: null,
        actionHint: null,
        dismissible: true,
      });
    case 'unsupported':
      return present({
        glyph: 'bell_off',
        title: copy.unsupported.title,
        body: copy.keepOpen,
        actionLabel: null,
        actionHint: null,
        dismissible: true,
      });
    case 'activating':
      return present({
        glyph: 'spinner',
        title: copy.activating.title,
        body: null,
        actionLabel: null,
        actionHint: null,
        dismissible: false,
      });
    case 'confirmed':
      return present({
        glyph: 'bell',
        title: copy.confirmed.title,
        body: null,
        actionLabel: null,
        actionHint: null,
        dismissible: false,
      });
  }
}

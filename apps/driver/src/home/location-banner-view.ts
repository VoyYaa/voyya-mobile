import { issuesCopy } from '../copy/issues-copy';
import type { LocationIssueKind } from '../state/useLocationIssueStore';

export type LocationBannerKind = LocationIssueKind | 'precise_location_needed';
export type LocationBannerTone = 'info' | 'warning' | 'danger';
export type LocationBannerIcon = 'pin' | 'clock' | 'alert';

export interface LocationBannerView {
  title: string;
  body: string;
  action: string;
  tone: LocationBannerTone;
  icon: LocationBannerIcon;
  urgent: boolean;
}

const VIEW_BY_KIND: Record<LocationBannerKind, LocationBannerView> = {
  gps_disabled: { ...issuesCopy.banner.gps_disabled, tone: 'warning', icon: 'pin', urgent: true },
  permission_denied: {
    ...issuesCopy.banner.permission_denied,
    tone: 'danger',
    icon: 'alert',
    urgent: true,
  },
  consent_required: {
    ...issuesCopy.banner.consent_required,
    tone: 'warning',
    icon: 'clock',
    urgent: false,
  },
  precise_location_needed: {
    ...issuesCopy.banner.precise_location_needed,
    tone: 'info',
    icon: 'pin',
    urgent: false,
  },
};

export function locationBannerView(kind: LocationBannerKind): LocationBannerView {
  return VIEW_BY_KIND[kind];
}

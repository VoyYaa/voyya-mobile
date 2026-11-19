import React from 'react';
import { Linking, Platform, Text, View } from 'react-native';
import { BrandSpinner, LinkButton, StatusBadge, useTheme } from '@voyyaa/ui-mobile';
import type { DriverLocationSharing } from '@voyyaa/shared';
import { useDemoSession } from '@voyyaa/app-runtime';
import {
  sharingDisplayKind,
  showIosForegroundNote,
  showNotificationsOff,
} from '../tracking/demo-sharing-view';
import { useSharingIndicator } from '../hooks/useSharingIndicator';
import { useResumeSharing } from '../hooks/useTripLocationSharing';
import { driverCopy } from '../copy/driver-copy';
import { LocationIssueBanner } from './LocationIssueBanner';

export interface SharingStatusBadgeProps {
  sharing: DriverLocationSharing | null;
  consentRequired: boolean;
  onReadConsent: () => void;
}

const copy = driverCopy.sharing;
const SPINNER_SIZE = 16;

export function SharingStatusBadge({
  sharing,
  consentRequired,
  onReadConsent,
}: SharingStatusBadgeProps): React.JSX.Element | null {
  const theme = useTheme();
  const { indicator, notificationsOff, iosForegroundOnly } = useSharingIndicator(
    sharing,
    consentRequired,
  );
  const resume = useResumeSharing();
  const demo = useDemoSession() !== null;
  const display = sharingDisplayKind(indicator, demo);

  if (display === 'none') return null;

  if (display === 'consent_required') {
    return <LocationIssueBanner kind="consent_required" context="trip" onPress={onReadConsent} />;
  }
  if (indicator.kind === 'location_issue' && display === 'location_issue') {
    return (
      <LocationIssueBanner
        kind={indicator.issue}
        context="trip"
        onPress={() => void Linking.openSettings()}
      />
    );
  }
  if (display === 'precise_needed') {
    return (
      <LocationIssueBanner
        kind="precise_location_needed"
        context="trip"
        onPress={() => void Linking.openSettings()}
      />
    );
  }

  return (
    <View style={{ gap: theme.spacing.xs }} testID="sharing-status">
      {display === 'capped' && (
        <>
          <StatusBadge tone="neutral" label={copy.capReached} />
          {resume.outcome === 'checking' ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
              <BrandSpinner size={SPINNER_SIZE} />
              <Text style={{ ...theme.typography.small, color: theme.colors.textMuted }}>
                {copy.resuming}
              </Text>
            </View>
          ) : (
            <View style={{ alignItems: 'flex-start' }}>
              <LinkButton label={copy.capAction} onPress={resume.resume} testID="sharing-resume" />
            </View>
          )}
          {resume.outcome === 'offline' && (
            <Text style={{ ...theme.typography.small, color: theme.colors.dangerInk }}>
              {copy.resumeOffline}
            </Text>
          )}
          {resume.outcome === 'failed' && (
            <Text style={{ ...theme.typography.small, color: theme.colors.dangerInk }}>
              {copy.resumeFailed}
            </Text>
          )}
        </>
      )}
      {display === 'no_fix' && <StatusBadge tone="warning" label={copy.noGps} />}
      {display === 'offline' && <StatusBadge tone="warning" label={copy.offline} />}
      {display === 'active' && <StatusBadge tone="success" label={copy.active} />}
      {display === 'demo_active' && (
        <StatusBadge
          tone="success"
          label={driverCopy.demo.sharingActive}
          testID="sharing-demo-active"
        />
      )}
      {showIosForegroundNote(iosForegroundOnly, display, Platform.OS === 'ios') && (
        <Text style={{ ...theme.typography.small, color: theme.colors.infoInk }}>
          {copy.iosOnlyForeground}
        </Text>
      )}
      {showNotificationsOff(notificationsOff, demo) && (
        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
          <Text style={{ ...theme.typography.small, color: theme.colors.textMuted }}>
            {copy.notificationsOff}{' '}
          </Text>
          <LinkButton
            label={copy.notificationsAction}
            onPress={() => void Linking.openSettings()}
            testID="sharing-notifications-settings"
          />
        </View>
      )}
    </View>
  );
}

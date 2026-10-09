import React from 'react';
import { Linking, Text, View } from 'react-native';
import { BrandSpinner, LinkButton, StatusBadge, useTheme } from '@voyyaa/ui-mobile';
import type { DriverLocationSharing } from '@voyyaa/shared';
import { useSharingIndicator } from '../hooks/useSharingIndicator';
import { useResumeSharing } from '../hooks/useTripLocationSharing';
import { driverCopy } from '../copy/driver-copy';
import { LocationIssueBanner } from './LocationIssueBanner';

export interface SharingStatusBadgeProps {
  sharing: DriverLocationSharing | null;
  onReadConsent: () => void;
}

const copy = driverCopy.sharing;
const SPINNER_SIZE = 16;

export function SharingStatusBadge({
  sharing,
  onReadConsent,
}: SharingStatusBadgeProps): React.JSX.Element | null {
  const theme = useTheme();
  const { indicator, notificationsOff, iosForegroundOnly } = useSharingIndicator(sharing);
  const resume = useResumeSharing();

  if (indicator.kind === 'none') return null;

  if (indicator.kind === 'consent_required') {
    return <LocationIssueBanner kind="consent_required" onPress={onReadConsent} />;
  }
  if (indicator.kind === 'location_issue') {
    return (
      <LocationIssueBanner kind={indicator.issue} onPress={() => void Linking.openSettings()} />
    );
  }
  if (indicator.kind === 'precise_needed') {
    return (
      <LocationIssueBanner
        kind="precise_location_needed"
        onPress={() => void Linking.openSettings()}
      />
    );
  }

  return (
    <View style={{ gap: theme.spacing.xs }} testID="sharing-status">
      {indicator.kind === 'capped' && (
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
      {indicator.kind === 'no_fix' && <StatusBadge tone="warning" label={copy.noGps} />}
      {indicator.kind === 'offline' && <StatusBadge tone="warning" label={copy.offline} />}
      {indicator.kind === 'active' && <StatusBadge tone="success" label={copy.active} />}
      {iosForegroundOnly && (
        <Text style={{ ...theme.typography.small, color: theme.colors.infoInk }}>
          {copy.iosOnlyForeground}
        </Text>
      )}
      {notificationsOff && (
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

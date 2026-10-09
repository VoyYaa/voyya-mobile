import React from 'react';
import { Pressable, Text } from 'react-native';
import { useTheme } from '@voyyaa/ui-mobile';
import type { LocationIssueKind } from '../state/useLocationIssueStore';
import { driverCopy } from '../copy/driver-copy';

export type LocationBannerKind = LocationIssueKind | 'precise_location_needed';

export interface LocationIssueBannerProps {
  kind: LocationBannerKind;
  onPress: () => void;
}

const MESSAGE_BY_KIND: Record<LocationBannerKind, string> = {
  permission_denied: driverCopy.issues.locationPermission,
  gps_disabled: driverCopy.issues.gpsDisabled,
  consent_required: driverCopy.issues.consentRequired,
  precise_location_needed: driverCopy.issues.preciseLocationNeeded,
};

export function LocationIssueBanner({
  kind,
  onPress,
}: LocationIssueBannerProps): React.JSX.Element {
  const theme = useTheme();
  const message = MESSAGE_BY_KIND[kind];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={message}
      accessibilityLiveRegion="polite"
      onPress={onPress}
      testID="location-issue-banner"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: theme.touch.min,
        backgroundColor: theme.colors.infoTint,
        borderRadius: theme.radius.card,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.sm,
        gap: theme.spacing.md,
      }}
    >
      <Text style={{ ...theme.typography.body, color: theme.colors.infoInk, flex: 1 }}>
        {message}
      </Text>
      <Text
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{ ...theme.typography.title, color: theme.colors.infoInk }}
      >
        ›
      </Text>
    </Pressable>
  );
}

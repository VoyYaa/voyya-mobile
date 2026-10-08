import React from 'react';
import { Pressable, Text } from 'react-native';
import { useTheme } from '@voyyaa/ui-mobile';
import type { LocationIssueKind } from '../state/useLocationIssueStore';
import { driverCopy } from '../copy/driver-copy';

export interface LocationIssueBannerProps {
  kind: LocationIssueKind;
  onOpenSettings: () => void;
}

const MESSAGE_BY_KIND: Record<LocationIssueKind, string> = {
  permission_denied: driverCopy.issues.locationPermission,
  gps_disabled: driverCopy.issues.gpsDisabled,
};

export function LocationIssueBanner({
  kind,
  onOpenSettings,
}: LocationIssueBannerProps): React.JSX.Element {
  const theme = useTheme();
  const message = MESSAGE_BY_KIND[kind];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={message}
      accessibilityLiveRegion="polite"
      onPress={onOpenSettings}
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

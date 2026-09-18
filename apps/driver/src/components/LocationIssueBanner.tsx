import React from 'react';
import { Pressable, Text } from 'react-native';
import { useTheme } from '@voyyaa/ui-mobile';
import type { LocationIssueKind } from '../state/useLocationIssueStore';

export interface LocationIssueBannerProps {
  kind: LocationIssueKind;
  onOpenSettings: () => void;
}

const MESSAGE_BY_KIND: Record<LocationIssueKind, string> = {
  permission_denied: 'Revisa el permiso de ubicación: no estás recibiendo solicitudes.',
  gps_disabled: 'Activa la ubicación de tu teléfono para poder recibir solicitudes.',
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
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: theme.touch.min,
        backgroundColor: theme.colors.dangerTint,
        borderRadius: theme.radius.card,
        paddingHorizontal: theme.spacing.lg,
      }}
    >
      <Text style={{ ...theme.typography.body, color: theme.colors.dangerInk, flex: 1 }}>
        {message}
      </Text>
      <Text style={{ ...theme.typography.title, color: theme.colors.dangerInk }}>›</Text>
    </Pressable>
  );
}

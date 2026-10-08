import React from 'react';
import { Text, View } from 'react-native';
import { Button, Card, MarkGlyph, useTheme } from '@voyyaa/ui-mobile';
import { driverCopy } from '../copy/driver-copy';

export type ShiftIssueKind =
  | 'permission_denied'
  | 'gps_disabled'
  | 'offline'
  | 'server_error'
  | 'blocked_by_trip'
  | 'consent_required';

export interface ShiftIssuePanelProps {
  kind: ShiftIssueKind;
  onAction?: () => void;
}

const ISSUE_COPY: Record<ShiftIssueKind, { message: string; actionLabel?: string }> = {
  permission_denied: {
    message: driverCopy.issues.permissionDenied,
    actionLabel: driverCopy.issues.permissionDeniedAction,
  },
  gps_disabled: {
    message: driverCopy.issues.gpsDisabled,
    actionLabel: driverCopy.issues.gpsDisabledAction,
  },
  offline: { message: driverCopy.issues.offline, actionLabel: driverCopy.issues.retry },
  server_error: { message: driverCopy.issues.serverError, actionLabel: driverCopy.issues.retry },
  blocked_by_trip: { message: driverCopy.issues.blockedByTrip },
  consent_required: {
    message: driverCopy.issues.consentRequired,
    actionLabel: driverCopy.issues.consentRequiredAction,
  },
};

export function ShiftIssuePanel({ kind, onAction }: ShiftIssuePanelProps): React.JSX.Element {
  const theme = useTheme();
  const copy = ISSUE_COPY[kind];

  return (
    <View accessibilityRole="alert" testID="shift-issue-panel">
      <Card tone="danger" style={{ gap: theme.spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
          <MarkGlyph glyph="error" size={40} />
          <Text style={{ ...theme.typography.body, color: theme.colors.dangerInk, flex: 1 }}>
            {copy.message}
          </Text>
        </View>
        {copy.actionLabel && onAction && (
          <Button label={copy.actionLabel} variant="secondary" size="sm" onPress={onAction} />
        )}
      </Card>
    </View>
  );
}

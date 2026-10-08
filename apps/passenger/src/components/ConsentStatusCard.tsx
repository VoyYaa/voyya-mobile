import React from 'react';
import { Text, View } from 'react-native';
import {
  Button,
  Card,
  ErrorState,
  Skeleton,
  StatusBadge,
  useDelayedLoading,
  useTheme,
  type StatusTone,
} from '@voyyaa/ui-mobile';
import type { ConsentStatus } from '@voyyaa/shared';
import { formatLongDate } from '../lib/format-date';
import { passengerCopy } from '../copy/passenger-copy';

export interface ConsentStatusCardProps {
  status: ConsentStatus | undefined;
  loading: boolean;
  failed: boolean;
  offline: boolean;
  onRetry: () => void;
  onPrimaryAction: () => void;
}

const copy = passengerCopy.privacy;
const SKELETON_HEIGHT = 112;

interface StatusView {
  badge: string;
  tone: StatusTone;
  body: string;
  version: string | null;
  action: string | null;
  actionVariant: 'primary' | 'secondary';
}

export function describeConsentStatus(status: ConsentStatus): StatusView {
  if (status.state === 'granted' && status.requires_acceptance) {
    return {
      badge: copy.updatedBadge,
      tone: 'warning',
      body: copy.updatedBody,
      version: null,
      action: copy.updatedAction,
      actionVariant: 'primary',
    };
  }
  if (status.state === 'granted') {
    const date = formatLongDate(status.granted_at);
    return {
      badge: copy.grantedBadge,
      tone: 'success',
      body: date ? copy.grantedBody(date) : copy.grantedBadge,
      version: status.notice_version ? copy.versionLine(status.notice_version) : null,
      action: null,
      actionVariant: 'primary',
    };
  }
  if (status.state === 'revoked') {
    const date = formatLongDate(status.revoked_at);
    return {
      badge: copy.revokedBadge,
      tone: 'neutral',
      body: date ? copy.revokedBody(date) : copy.revokedBadge,
      version: null,
      action: copy.revokedAction,
      actionVariant: 'secondary',
    };
  }
  return {
    badge: copy.noneBadge,
    tone: 'neutral',
    body: copy.noneBody,
    version: null,
    action: copy.noneAction,
    actionVariant: 'secondary',
  };
}

export function ConsentStatusCard({
  status,
  loading,
  failed,
  offline,
  onRetry,
  onPrimaryAction,
}: ConsentStatusCardProps): React.JSX.Element {
  const theme = useTheme();
  const showSkeleton = useDelayedLoading(loading && !offline);

  if (offline) {
    return (
      <Card testID="privacy-offline" style={{ gap: theme.spacing.sm }}>
        <StatusBadge label={copy.offlineTitle} tone="info" />
      </Card>
    );
  }

  if (loading) {
    return showSkeleton ? (
      <Skeleton height={SKELETON_HEIGHT} radius={theme.radius.card} testID="privacy-skeleton" />
    ) : (
      <View style={{ height: SKELETON_HEIGHT }} />
    );
  }

  if (failed || !status) {
    return (
      <Card testID="privacy-error">
        <ErrorState title={copy.loadErrorTitle} body={copy.loadErrorBody} onRetry={onRetry} />
      </Card>
    );
  }

  const view = describeConsentStatus(status);

  return (
    <Card testID="privacy-status" style={{ gap: theme.spacing.md }}>
      <View accessible accessibilityLabel={copy.statusAnnounce(view.badge)}>
        <StatusBadge label={view.badge} tone={view.tone} testID="privacy-badge" />
      </View>
      <View style={{ gap: theme.spacing.xs }}>
        <Text style={{ ...theme.typography.body, color: theme.colors.text }}>{view.body}</Text>
        {view.version && (
          <Text style={{ ...theme.typography.small, color: theme.colors.textSubtle }}>
            {view.version}
          </Text>
        )}
      </View>
      {view.action && (
        <Button
          label={view.action}
          variant={view.actionVariant}
          onPress={onPrimaryAction}
          testID="privacy-primary-action"
        />
      )}
    </Card>
  );
}

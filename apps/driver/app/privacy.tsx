import React, { useState } from 'react';
import { Linking, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Card,
  ErrorState,
  LinkButton,
  MarkGlyph,
  ScreenHeader,
  Skeleton,
  StatusBadge,
  Toast,
  useDelayedLoading,
  useTheme,
  type StatusBadgeTone,
} from '@voyyaa/ui-mobile';
import type { ConsentStatus } from '@voyyaa/shared';
import { DATA_CONTROLLER } from '@voyyaa/shared';
import {
  isNetworkError,
  useLocationConsentStatus,
  useNetworkStatus,
  useRevokeLocationConsent,
} from '@voyyaa/app-runtime';
import { InlineNotice } from '../src/components/InlineNotice';
import { LocationConsentSheet } from '../src/components/LocationConsentSheet';
import { RevokeLocationSheet, type RevokeFailure } from '../src/components/RevokeLocationSheet';
import { DRIVER_HOME_QUERY_KEY, useDriverHome } from '../src/hooks/useDriverHome';
import { useSystemLocationPermission } from '../src/hooks/useSystemLocationPermission';
import {
  canRevoke,
  consentView,
  formatNoticeDate,
  isMailableAddress,
  type ConsentView,
} from '../src/privacy/privacy-status';
import { driverCopy } from '../src/copy/driver-copy';

const STATUS_SKELETON_HEIGHT = 112;

interface ViewPresentation {
  badge: string;
  tone: StatusBadgeTone;
  lines: string[];
  action: { label: string; variant: 'primary' | 'secondary' } | null;
}

function presentationOf(view: ConsentView, status: ConsentStatus): ViewPresentation {
  const copy = driverCopy.privacy;
  const unknown = copy.dateUnknown;
  switch (view) {
    case 'shared':
      return {
        badge: copy.sharing,
        tone: 'success',
        lines: [
          copy.sharingBody(formatNoticeDate(status.granted_at) ?? unknown),
          copy.sharingVersion(status.notice_version ?? status.current_notice_version),
        ],
        action: null,
      };
    case 'new_notice':
      return {
        badge: copy.newNotice,
        tone: 'warning',
        lines: [copy.newNoticeBody],
        action: { label: copy.readAndAccept, variant: 'primary' },
      };
    case 'revoked':
      return {
        badge: copy.revoked,
        tone: 'neutral',
        lines: [copy.revokedBody(formatNoticeDate(status.revoked_at) ?? unknown)],
        action: { label: copy.shareAgain, variant: 'secondary' },
      };
    case 'none':
      return {
        badge: copy.none,
        tone: 'neutral',
        lines: [copy.noneBody],
        action: { label: copy.readNotice, variant: 'secondary' },
      };
  }
}

type NoticeSheet = 'closed' | 'accept' | 'read';

export default function PrivacyScreen(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const offline = useNetworkStatus() === 'offline';
  const copy = driverCopy.privacy;

  const consent = useLocationConsentStatus();
  const revoke = useRevokeLocationConsent();
  const home = useDriverHome();
  const permission = useSystemLocationPermission();

  const [noticeSheet, setNoticeSheet] = useState<NoticeSheet>('closed');
  const [revokeVisible, setRevokeVisible] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const hasActiveTrip = Boolean(home.data?.active_trip);
  const showSkeleton = useDelayedLoading(consent.isLoading);
  const status = consent.data;
  const failure: RevokeFailure = revoke.isError
    ? isNetworkError(revoke.error)
      ? 'offline'
      : 'server'
    : null;

  const handleRevoke = (): void => {
    revoke.mutate(undefined, {
      onSuccess: () => {
        setRevokeVisible(false);
        setToast(hasActiveTrip ? copy.toastRevokedActiveTrip : copy.toastRevoked);
        void queryClient.invalidateQueries({ queryKey: DRIVER_HOME_QUERY_KEY });
      },
    });
  };

  const closeRevoke = (): void => {
    setRevokeVisible(false);
    revoke.reset();
  };

  const openMail = (): void => {
    void Linking.openURL(`mailto:${DATA_CONTROLLER.privacy_email}`);
  };

  const renderStatusCard = (): React.JSX.Element | null => {
    if (status) {
      const view = consentView(status);
      const presentation = presentationOf(view, status);
      return (
        <Card testID="privacy-status-card">
          <View
            accessible
            accessibilityLabel={copy.statusLabel(presentation.badge.toLowerCase())}
            style={{ gap: theme.spacing.sm }}
          >
            <View style={{ alignSelf: 'flex-start' }}>
              <StatusBadge label={presentation.badge} tone={presentation.tone} />
            </View>
            {presentation.lines.map((line, index) => (
              <Text
                key={line}
                style={{
                  ...(index === 0 ? theme.typography.body : theme.typography.small),
                  color: index === 0 ? theme.colors.text : theme.colors.textSubtle,
                }}
              >
                {line}
              </Text>
            ))}
          </View>
          {offline && (
            <Text
              accessibilityLiveRegion="polite"
              style={{
                ...theme.typography.small,
                color: theme.colors.infoInk,
                marginTop: theme.spacing.sm,
              }}
            >
              {copy.offlineStatus}
            </Text>
          )}
          {presentation.action && (
            <Button
              label={presentation.action.label}
              variant={presentation.action.variant}
              disabled={offline}
              accessibilityHint={offline ? copy.offlineHint : undefined}
              onPress={() => setNoticeSheet('accept')}
              style={{ marginTop: theme.spacing.md }}
              testID="privacy-primary-action"
            />
          )}
        </Card>
      );
    }
    if (consent.isError) {
      return isNetworkError(consent.error) ? (
        <Card testID="privacy-offline">
          <InlineNotice
            tone="info"
            message={copy.offlineStatus}
            actionLabel={driverCopy.consentNotice.retry}
            onAction={() => void consent.refetch()}
          />
        </Card>
      ) : (
        <ErrorState
          title={copy.loadError}
          onRetry={() => void consent.refetch()}
          testID="privacy-error"
        />
      );
    }
    return showSkeleton ? (
      <View testID="privacy-loading">
        <Skeleton height={STATUS_SKELETON_HEIGHT} radius={theme.radius.card} />
      </View>
    ) : null;
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg, paddingTop: insets.top }}>
      <ScreenHeader title={copy.title} onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={{
          padding: theme.spacing.lg,
          paddingBottom: insets.bottom + theme.spacing.xl,
          gap: theme.spacing.lg,
        }}
      >
        {renderStatusCard()}

        <LinkButton
          label={copy.readFull}
          onPress={() => setNoticeSheet('read')}
          style={{ alignSelf: 'flex-start' }}
          testID="privacy-read-notice"
        />

        {permission === 'denied' && (
          <Card tone="tint" testID="privacy-permission-removed">
            <View style={{ gap: theme.spacing.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
                <MarkGlyph glyph="error" size={32} animate={false} />
                <Text
                  accessibilityRole="header"
                  style={{ ...theme.typography.subtitle, color: theme.colors.text, flex: 1 }}
                >
                  {copy.permissionTitle}
                </Text>
              </View>
              <Text style={{ ...theme.typography.body, color: theme.colors.textMuted }}>
                {copy.permissionBody}
              </Text>
              <LinkButton
                label={copy.openSettings}
                onPress={() => void Linking.openSettings()}
                style={{ alignSelf: 'flex-start' }}
              />
            </View>
          </Card>
        )}

        {status && canRevoke(status.state) && (
          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: theme.colors.border,
              paddingTop: theme.spacing.md,
              alignItems: 'flex-start',
            }}
          >
            <LinkButton
              label={copy.revoke}
              tone="danger"
              disabled={offline}
              accessibilityHint={offline ? copy.offlineHint : undefined}
              onPress={() => setRevokeVisible(true)}
              testID="privacy-revoke"
            />
          </View>
        )}

        <View style={{ gap: theme.spacing.xs }}>
          <Text style={{ ...theme.typography.small, color: theme.colors.textMuted }}>
            {copy.rights(DATA_CONTROLLER.privacy_email)}
          </Text>
          {isMailableAddress(DATA_CONTROLLER.privacy_email) && (
            <LinkButton
              label={copy.mailAction}
              accessibilityHint={copy.mailHint}
              onPress={openMail}
              style={{ alignSelf: 'flex-start' }}
            />
          )}
        </View>
      </ScrollView>

      <LocationConsentSheet
        visible={noticeSheet !== 'closed'}
        mode={noticeSheet === 'read' ? 'read' : 'accept'}
        onAccepted={() => setNoticeSheet('closed')}
        onDismiss={() => setNoticeSheet('closed')}
      />
      <RevokeLocationSheet
        visible={revokeVisible}
        hasActiveTrip={hasActiveTrip}
        loading={revoke.isPending}
        failure={failure}
        onConfirm={handleRevoke}
        onClose={closeRevoke}
      />
      <Toast
        message={toast ?? ''}
        tone="success"
        visible={toast !== null}
        onHide={() => setToast(null)}
        bottomOffset={insets.bottom}
      />
    </View>
  );
}

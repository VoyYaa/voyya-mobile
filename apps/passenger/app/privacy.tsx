import React, { useEffect, useState } from 'react';
import { Linking, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinkButton, ScreenHeader, Toast, useTheme } from '@voyyaa/ui-mobile';
import { DATA_CONTROLLER, hasLegalPlaceholders } from '@voyyaa/shared';
import {
  isNetworkError,
  useGrantLocationConsent,
  useLocationConsentStatus,
  useNetworkStatus,
  useRevokeLocationConsent,
} from '@voyyaa/app-runtime';
import { ConsentStatusCard } from '../src/components/ConsentStatusCard';
import { LocationConsentSheet } from '../src/components/LocationConsentSheet';
import { RevokeConsentSheet, type RevokeFailure } from '../src/components/RevokeConsentSheet';
import { useActiveTrip } from '../src/hooks/useActiveTrip';
import { useTripDraftStore } from '../src/state/useTripDraftStore';
import { passengerCopy } from '../src/copy/passenger-copy';

const copy = passengerCopy.privacy;

type NoticeMode = 'review' | 'consent' | null;

interface ToastState {
  message: string;
  tone: 'success' | 'info';
}

export default function PrivacyScreen(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const network = useNetworkStatus();
  const offline = network === 'offline';
  const status = useLocationConsentStatus();
  const grant = useGrantLocationConsent();
  const revoke = useRevokeLocationConsent();
  const activeTrip = useActiveTrip();
  const originSource = useTripDraftStore((s) => s.originSource);
  const clearOrigin = useTripDraftStore((s) => s.clearOrigin);

  const [noticeMode, setNoticeMode] = useState<NoticeMode>(null);
  const [revokeVisible, setRevokeVisible] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const consentStatus = status.data;
  const canRevoke = consentStatus?.state === 'granted' && !offline;
  const canWriteEmail = !hasLegalPlaceholders(DATA_CONTROLLER.privacy_email);

  const revokeFailure: RevokeFailure = revoke.isError
    ? isNetworkError(revoke.error)
      ? 'offline'
      : 'error'
    : null;

  const openNotice = (mode: Exclude<NoticeMode, null>): void => {
    grant.reset();
    setNoticeMode(mode);
  };

  const closeNotice = (): void => {
    if (grant.isPending) return;
    setNoticeMode(null);
    grant.reset();
  };

  const handlePrimaryAction = (): void => {
    openNotice('consent');
  };

  const handleAccept = (): void => {
    grant.mutate(undefined, {
      onSuccess: () => {
        setNoticeMode(null);
        setToast({ message: copy.grantedToast, tone: 'success' });
      },
    });
  };

  const openRevoke = (): void => {
    revoke.reset();
    setRevokeVisible(true);
  };

  const closeRevoke = (): void => {
    if (revoke.isPending) return;
    setRevokeVisible(false);
    revoke.reset();
  };

  const handleRevoke = (): void => {
    revoke.mutate(undefined, {
      onSuccess: () => {
        if (originSource === 'gps') clearOrigin();
        setRevokeVisible(false);
        setToast({ message: copy.revokedToast, tone: 'success' });
      },
    });
  };

  useEffect(() => {
    if (revokeVisible && revokeFailure === 'offline' && network === 'online' && !revoke.isPending) {
      handleRevoke();
    }
  }, [network]);

  const noticeErrorMessage = grant.isError ? passengerCopy.locationConsent.saveError : undefined;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={['top']}>
      <ScreenHeader title={copy.header} onBack={() => router.back()} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: theme.spacing.lg,
          paddingBottom: theme.spacing.xl + insets.bottom,
          gap: theme.spacing.lg,
        }}
      >
        <ConsentStatusCard
          status={consentStatus}
          loading={status.isPending}
          failed={status.isError}
          offline={offline}
          onRetry={() => void status.refetch()}
          onPrimaryAction={handlePrimaryAction}
        />

        <View style={{ alignItems: 'flex-start' }}>
          <LinkButton
            label={copy.readNotice}
            onPress={() => openNotice('review')}
            testID="privacy-read-notice"
          />
        </View>

        {consentStatus?.state === 'granted' && (
          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: theme.colors.border,
              paddingTop: theme.spacing.md,
              alignItems: 'flex-start',
            }}
          >
            <LinkButton
              label={copy.revokeLink}
              tone="danger"
              disabled={!canRevoke}
              accessibilityHint={offline ? copy.offlineHint : undefined}
              onPress={openRevoke}
              testID="privacy-revoke-link"
            />
          </View>
        )}

        <View style={{ gap: theme.spacing.xs, alignItems: 'flex-start' }}>
          <Text style={{ ...theme.typography.small, color: theme.colors.textMuted }}>
            {copy.rights(DATA_CONTROLLER.privacy_email)}
          </Text>
          {canWriteEmail && (
            <LinkButton
              label={copy.emailAction}
              accessibilityHint={copy.emailHint}
              onPress={() => void Linking.openURL(`mailto:${DATA_CONTROLLER.privacy_email}`)}
            />
          )}
        </View>
      </ScrollView>

      <LocationConsentSheet
        visible={noticeMode !== null}
        mode={noticeMode === 'review' ? 'review' : 'consent'}
        loading={grant.isPending}
        errorMessage={noticeErrorMessage}
        onContinue={handleAccept}
        onDismiss={closeNotice}
      />

      <RevokeConsentSheet
        visible={revokeVisible}
        loading={revoke.isPending}
        failure={revokeFailure}
        hasActiveTrip={Boolean(activeTrip.data)}
        onConfirm={handleRevoke}
        onCancel={closeRevoke}
        onOpenSettings={() => void Linking.openSettings()}
      />

      <Toast
        message={toast?.message ?? ''}
        tone={toast?.tone ?? 'success'}
        visible={toast !== null}
        onHide={() => setToast(null)}
        testID="privacy-toast"
      />
    </SafeAreaView>
  );
}

import React from 'react';
import { Text, View } from 'react-native';
import { BottomSheet, Button, LinkButton, uiCopy, useTheme } from '@voyyaa/ui-mobile';
import { passengerCopy } from '../copy/passenger-copy';

export type RevokeFailure = 'offline' | 'error' | null;

export interface RevokeConsentSheetProps {
  visible: boolean;
  loading: boolean;
  failure: RevokeFailure;
  hasActiveTrip: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  onOpenSettings: () => void;
}

const DOT_SIZE = 6;
const copy = passengerCopy.privacy;

function ignore(): void {
  return undefined;
}

export function RevokeConsentSheet({
  visible,
  loading,
  failure,
  hasActiveTrip,
  onConfirm,
  onCancel,
  onOpenSettings,
}: RevokeConsentSheetProps): React.JSX.Element {
  const theme = useTheme();
  const lines = hasActiveTrip ? [copy.revokeActiveTripLine, ...copy.revokeLines] : copy.revokeLines;
  const failureMessage =
    failure === 'offline' ? copy.revokeOffline : failure === 'error' ? copy.revokeError : null;

  return (
    <BottomSheet
      visible={visible}
      onClose={loading ? ignore : onCancel}
      title={copy.revokeTitle}
      testID="revoke-consent-sheet"
    >
      <View style={{ gap: theme.spacing.lg }}>
        <View style={{ gap: theme.spacing.sm }}>
          {lines.map((line) => (
            <View key={line} style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
              <View
                style={{
                  width: DOT_SIZE,
                  height: DOT_SIZE,
                  borderRadius: DOT_SIZE / 2,
                  backgroundColor: theme.colors.brand,
                  marginTop: 9,
                }}
              />
              <Text style={{ ...theme.typography.body, color: theme.colors.textMuted, flex: 1 }}>
                {line}
              </Text>
            </View>
          ))}
        </View>
        {failureMessage && (
          <Text
            accessibilityRole="alert"
            style={{
              ...theme.typography.small,
              color: failure === 'offline' ? theme.colors.infoInk : theme.colors.dangerInk,
            }}
            testID="revoke-consent-failure"
          >
            {failureMessage}
          </Text>
        )}
        <View style={{ gap: theme.spacing.sm }}>
          <Button
            label={
              failure === 'offline'
                ? copy.retryNow
                : failure === 'error'
                  ? copy.retry
                  : copy.revokeConfirm
            }
            variant="secondary"
            size="lg"
            loading={loading}
            loadingLabel={copy.revoking}
            onPress={onConfirm}
            testID="revoke-consent-confirm"
          />
          <View style={{ alignItems: 'center' }}>
            <LinkButton
              label={copy.openSettings}
              onPress={onOpenSettings}
              disabled={loading}
              style={{ alignSelf: 'center' }}
              testID="revoke-consent-settings"
            />
            <LinkButton
              label={uiCopy.cancel}
              tone="muted"
              disabled={loading}
              onPress={onCancel}
              style={{ alignSelf: 'center' }}
              testID="revoke-consent-cancel"
            />
          </View>
        </View>
      </View>
    </BottomSheet>
  );
}

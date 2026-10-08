import React from 'react';
import { Text, View } from 'react-native';
import { BottomSheet, Button, LinkButton, useTheme } from '@voyyaa/ui-mobile';
import { driverCopy } from '../copy/driver-copy';
import { InlineNotice } from './InlineNotice';

export type RevokeFailure = 'offline' | 'server' | null;

export interface RevokeLocationSheetProps {
  visible: boolean;
  hasActiveTrip: boolean;
  loading: boolean;
  failure: RevokeFailure;
  onConfirm: () => void;
  onClose: () => void;
}

const DOT_SIZE = 8;

export function RevokeLocationSheet({
  visible,
  hasActiveTrip,
  loading,
  failure,
  onConfirm,
  onClose,
}: RevokeLocationSheetProps): React.JSX.Element {
  const theme = useTheme();
  const copy = driverCopy.privacy;
  const lines = hasActiveTrip ? copy.revokeLinesActiveTrip : copy.revokeLines;

  return (
    <BottomSheet
      visible={visible}
      onClose={loading ? () => undefined : onClose}
      title={copy.revokeTitle}
      testID="revoke-location-sheet"
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
                  marginTop: theme.spacing.sm,
                  backgroundColor: theme.colors.brandInk,
                }}
              />
              <Text style={{ ...theme.typography.body, color: theme.colors.textMuted, flex: 1 }}>
                {line}
              </Text>
            </View>
          ))}
        </View>

        {failure === 'offline' && (
          <InlineNotice tone="info" message={copy.revokeOffline} testID="revoke-offline" />
        )}
        {failure === 'server' && (
          <InlineNotice tone="danger" message={copy.revokeError} testID="revoke-error" />
        )}

        <View style={{ gap: theme.spacing.sm }}>
          <Button
            label={failure ? copy.revokeRetry : copy.revokeConfirm}
            loadingLabel={copy.revoking}
            variant={failure ? 'primary' : 'danger'}
            size="lg"
            loading={loading}
            onPress={onConfirm}
            testID="revoke-confirm"
          />
          <View style={{ alignItems: 'center' }}>
            <LinkButton
              label={copy.revokeKeep}
              tone="muted"
              disabled={loading}
              onPress={onClose}
              style={{ alignSelf: 'center' }}
              testID="revoke-cancel"
            />
          </View>
        </View>
      </View>
    </BottomSheet>
  );
}

import React from 'react';
import { Text, View } from 'react-native';
import { BottomSheet, Button, LinkButton, useTheme } from '@voyyaa/ui-mobile';
import { passengerCopy } from '../copy/passenger-copy';

export interface CancelConfirmSheetProps {
  visible: boolean;
  withinWindow: boolean;
  loading: boolean;
  onConfirmCancel: () => void;
  onKeepWaiting: () => void;
}

export function CancelConfirmSheet({
  visible,
  withinWindow,
  loading,
  onConfirmCancel,
  onKeepWaiting,
}: CancelConfirmSheetProps): React.JSX.Element {
  const theme = useTheme();
  const copy = passengerCopy.cancelSheet;

  return (
    <BottomSheet visible={visible} onClose={onKeepWaiting} title={copy.title}>
      {withinWindow ? (
        <Text style={{ ...theme.typography.body, color: theme.colors.text }}>
          <Text style={{ ...theme.typography.bodyStrong, color: theme.colors.successInk }}>
            {copy.free}
          </Text>{' '}
          {copy.freeBody}
        </Text>
      ) : (
        <Text style={{ ...theme.typography.body, color: theme.colors.text }}>
          {copy.lateBodyPrefix}{' '}
          <Text style={{ ...theme.typography.bodyStrong, color: theme.colors.dangerInk }}>
            {copy.lateEmphasis}
          </Text>
          .
        </Text>
      )}
      <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.sm }}>
        <Button
          label={copy.confirm}
          variant="danger"
          size="lg"
          loading={loading}
          loadingLabel={copy.cancelling}
          onPress={onConfirmCancel}
          testID="cancel-confirm-button"
        />
        <View style={{ alignItems: 'center' }}>
          <LinkButton
            label={copy.keep}
            disabled={loading}
            onPress={onKeepWaiting}
            style={{ alignSelf: 'center' }}
          />
        </View>
      </View>
    </BottomSheet>
  );
}

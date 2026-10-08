import React from 'react';
import { Text, View } from 'react-native';
import { BottomSheet, Button, useTheme } from '@voyyaa/ui-mobile';
import { driverCopy } from '../copy/driver-copy';

export interface StartedConfirmSheetProps {
  visible: boolean;
  loading: boolean;
  errorMessage?: string;
  onConfirm: () => void;
  onKeepWaiting: () => void;
}

export function StartedConfirmSheet({
  visible,
  loading,
  errorMessage,
  onConfirm,
  onKeepWaiting,
}: StartedConfirmSheetProps): React.JSX.Element {
  const theme = useTheme();

  return (
    <BottomSheet
      visible={visible}
      onClose={onKeepWaiting}
      title={driverCopy.trip.startedSheetTitle}
      testID="started-confirm-sheet"
    >
      <Text style={{ ...theme.typography.body, color: theme.colors.text }}>
        {driverCopy.trip.startedSheetBody}
      </Text>

      {errorMessage && (
        <Text
          accessibilityRole="alert"
          style={{
            ...theme.typography.small,
            color: theme.colors.dangerInk,
            marginTop: theme.spacing.sm,
          }}
        >
          {errorMessage}
        </Text>
      )}

      <View style={{ marginTop: theme.spacing.md, gap: theme.spacing.sm }}>
        <Button
          label={driverCopy.trip.startedSheetConfirm}
          loadingLabel={driverCopy.trip.startedSheetLoading}
          loading={loading}
          onPress={onConfirm}
          testID="started-confirm"
        />
        <Button
          label={driverCopy.trip.startedSheetKeep}
          variant="ghost"
          disabled={loading}
          onPress={onKeepWaiting}
        />
      </View>
    </BottomSheet>
  );
}

import React from 'react';
import { Text, View } from 'react-native';
import { BottomSheet, Button, LinkButton, useTheme } from '@voyyaa/ui-mobile';
import { driverCopy } from '../copy/driver-copy';

export interface PinLogoutSheetProps {
  visible: boolean;
  loggingOut: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function PinLogoutSheet({
  visible,
  loggingOut,
  onConfirm,
  onClose,
}: PinLogoutSheetProps): React.JSX.Element {
  const theme = useTheme();

  return (
    <BottomSheet
      visible={visible}
      onClose={loggingOut ? () => undefined : onClose}
      title={driverCopy.createPin.logoutConfirmTitle}
      testID="pin-logout-sheet"
    >
      <View style={{ gap: theme.spacing.lg }}>
        <Text style={{ ...theme.typography.body, color: theme.colors.textMuted }}>
          {driverCopy.createPin.logoutConfirmBody}
        </Text>
        <View style={{ gap: theme.spacing.sm }}>
          <Button
            label={driverCopy.createPin.logout}
            loadingLabel={driverCopy.createPin.loggingOut}
            variant="danger"
            size="lg"
            loading={loggingOut}
            onPress={onConfirm}
            testID="pin-logout-confirm"
          />
          <View style={{ alignItems: 'center' }}>
            <LinkButton
              label={driverCopy.createPin.cancel}
              tone="muted"
              disabled={loggingOut}
              onPress={onClose}
              style={{ alignSelf: 'center' }}
            />
          </View>
        </View>
      </View>
    </BottomSheet>
  );
}

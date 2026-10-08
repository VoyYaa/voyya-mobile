import React from 'react';
import { Text, View } from 'react-native';
import { BottomSheet, Button, LinkButton, useTheme } from '@voyyaa/ui-mobile';
import { passengerCopy } from '../copy/passenger-copy';

export type ActiveTripConflictFailure = 'error' | 'offline' | null;

export interface ActiveTripConflictSheetProps {
  visible: boolean;
  loading: boolean;
  failure: ActiveTripConflictFailure;
  onViewTrip: () => void;
  onClose: () => void;
}

const copy = passengerCopy.activeTrip;

function ignore(): void {
  return undefined;
}

export function ActiveTripConflictSheet({
  visible,
  loading,
  failure,
  onViewTrip,
  onClose,
}: ActiveTripConflictSheetProps): React.JSX.Element {
  const theme = useTheme();
  const failureMessage =
    failure === 'offline' ? copy.openOffline : failure === 'error' ? copy.openError : null;

  return (
    <BottomSheet
      visible={visible}
      onClose={loading ? ignore : onClose}
      title={copy.conflictTitle}
      testID="active-trip-conflict-sheet"
    >
      <View style={{ gap: theme.spacing.lg }}>
        <Text style={{ ...theme.typography.body, color: theme.colors.textMuted }}>
          {copy.conflictBody}
        </Text>
        {failureMessage && (
          <Text
            accessibilityRole="alert"
            style={{
              ...theme.typography.small,
              color: failure === 'offline' ? theme.colors.infoInk : theme.colors.dangerInk,
            }}
            testID="active-trip-conflict-failure"
          >
            {failureMessage}
          </Text>
        )}
        <View style={{ gap: theme.spacing.sm }}>
          <Button
            label={failureMessage ? copy.retry : copy.cardAction}
            size="lg"
            loading={loading}
            loadingLabel={copy.opening}
            onPress={onViewTrip}
            testID="active-trip-conflict-view"
          />
          <View style={{ alignItems: 'center' }}>
            <LinkButton
              label={copy.close}
              tone="muted"
              disabled={loading}
              onPress={onClose}
              style={{ alignSelf: 'center' }}
              testID="active-trip-conflict-close"
            />
          </View>
        </View>
      </View>
    </BottomSheet>
  );
}

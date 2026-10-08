import React from 'react';
import { View } from 'react-native';
import { Button, useTheme } from '@voyyaa/ui-mobile';
import { driverCopy } from '../copy/driver-copy';

export type ActionButtonLoading = 'accept' | 'reject' | null;

export interface ActionButtonPairProps {
  onAccept: () => void;
  onReject: () => void;
  loading?: ActionButtonLoading;
  disabled?: boolean;
}

const REJECT_FLEX = 1;
const ACCEPT_FLEX = 2;

export function ActionButtonPair({
  onAccept,
  onReject,
  loading = null,
  disabled = false,
}: ActionButtonPairProps): React.JSX.Element {
  const theme = useTheme();
  const isDisabled = disabled || loading !== null;

  return (
    <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
      <Button
        label={driverCopy.offer.reject}
        accessibilityLabel={driverCopy.offer.rejectLabel}
        variant="ghost"
        size="lg"
        loading={loading === 'reject'}
        disabled={isDisabled && loading !== 'reject'}
        onPress={onReject}
        style={{ flex: REJECT_FLEX }}
        testID="offer-reject"
      />
      <Button
        label={driverCopy.offer.accept}
        loadingLabel={driverCopy.offer.accepting}
        accessibilityLabel={driverCopy.offer.acceptLabel}
        size="lg"
        loading={loading === 'accept'}
        disabled={isDisabled && loading !== 'accept'}
        onPress={onAccept}
        style={{ flex: ACCEPT_FLEX }}
        testID="offer-accept"
      />
    </View>
  );
}

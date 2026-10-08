import React from 'react';
import { Text, View } from 'react-native';
import { Card, useTheme } from '@voyyaa/ui-mobile';
import { driverCopy } from '../copy/driver-copy';

export interface PendingCashBannerProps {
  count: number;
  onPress: () => void;
}

export function PendingCashBanner({
  count,
  onPress,
}: PendingCashBannerProps): React.JSX.Element | null {
  const theme = useTheme();

  if (count <= 0) return null;

  const label = driverCopy.home.cashBanner(count);

  return (
    <Card tone="tint" onPress={onPress} accessibilityLabel={label} testID="pending-cash-banner">
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
        <Text
          accessibilityLiveRegion="polite"
          style={{ ...theme.typography.bodyStrong, color: theme.colors.text, flex: 1 }}
        >
          {label}
        </Text>
        <Text
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={{ ...theme.typography.title, color: theme.colors.brandInk }}
        >
          ›
        </Text>
      </View>
    </Card>
  );
}

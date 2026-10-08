import React from 'react';
import { Text, View } from 'react-native';
import { BrandSpinner, useTheme } from '@voyyaa/ui-mobile';
import { passengerCopy } from '../copy/passenger-copy';

export function LocatingPill(): React.JSX.Element {
  const theme = useTheme();

  return (
    <View
      testID="locating-pill"
      accessibilityLabel={passengerCopy.home.locating}
      accessibilityLiveRegion="polite"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: theme.spacing.sm,
        backgroundColor: theme.colors.stage,
        borderRadius: theme.radius.pill,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        minHeight: theme.touch.min - theme.spacing.sm,
      }}
    >
      <BrandSpinner size={16} tone="onDark" />
      <Text style={{ ...theme.typography.smallStrong, color: theme.colors.onStage }}>
        {passengerCopy.home.locating}
      </Text>
    </View>
  );
}

import React from 'react';
import { View } from 'react-native';
import { StatePanel, useTheme } from '@voyyaa/ui-mobile';
import { passengerCopy } from '../copy/passenger-copy';

export interface CoverageBlockedPanelProps {
  onAdjustLocation: () => void;
}

export function CoverageBlockedPanel({
  onAdjustLocation,
}: CoverageBlockedPanelProps): React.JSX.Element {
  const theme = useTheme();

  return (
    <View
      accessibilityViewIsModal
      style={{
        flex: 1,
        backgroundColor: theme.colors.bg,
        justifyContent: 'center',
        padding: theme.spacing.lg,
      }}
    >
      <StatePanel
        glyph="pin"
        title={passengerCopy.coverage.title}
        primaryAction={{ label: passengerCopy.coverage.action, onPress: onAdjustLocation }}
        testID="coverage-blocked"
      />
    </View>
  );
}

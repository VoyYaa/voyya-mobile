import React from 'react';
import { View } from 'react-native';
import { StatePanel, uiCopy, useTheme } from '@voyyaa/ui-mobile';
import { passengerCopy } from '../copy/passenger-copy';

export interface CoverageBlockedPanelProps {
  onAdjustLocation: () => void;
  demo?: boolean;
  onLogout?: () => void;
}

export function CoverageBlockedPanel({
  onAdjustLocation,
  demo = false,
  onLogout,
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
        title={demo ? passengerCopy.demo.coverageUnavailableTitle : passengerCopy.coverage.title}
        body={demo ? passengerCopy.demo.coverageUnavailableBody : undefined}
        primaryAction={
          demo
            ? { label: uiCopy.logout, onPress: onLogout ?? onAdjustLocation }
            : { label: passengerCopy.coverage.action, onPress: onAdjustLocation }
        }
        testID={demo ? 'coverage-blocked-demo' : 'coverage-blocked'}
      />
    </View>
  );
}

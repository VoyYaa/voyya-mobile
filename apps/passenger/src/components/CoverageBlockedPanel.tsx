import React from 'react';
import { Text, View } from 'react-native';
import { Button, useTheme } from '@voyyaa/ui-mobile';

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
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.xl,
        gap: theme.spacing.md,
      }}
    >
      <Text
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{ fontSize: 40 }}
      >
        📍
      </Text>
      <Text
        accessibilityRole="header"
        style={{ ...theme.typography.title, color: theme.colors.text, textAlign: 'center' }}
      >
        Tu ubicación actual está fuera de la zona de cobertura de Yarumal.
      </Text>
      <View style={{ width: '100%', marginTop: theme.spacing.md }}>
        <Button label="Ajustar ubicación en el mapa" onPress={onAdjustLocation} />
      </View>
    </View>
  );
}

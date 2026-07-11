import React from 'react';
import { Pressable, Switch, Text, View } from 'react-native';
import { Card, useTheme } from '@voyyaa/ui-mobile';

export interface ShiftToggleProps {
  onShift: boolean;
  onToggle: (next: boolean) => void;
}

export function ShiftToggle({ onShift, onToggle }: ShiftToggleProps): React.JSX.Element {
  const theme = useTheme();

  return (
    <Card>
      <Pressable
        onPress={() => onToggle(!onShift)}
        accessibilityRole="switch"
        accessibilityState={{ checked: onShift }}
        accessibilityLabel={onShift ? 'Turno activado' : 'Turno desactivado'}
        accessibilityHint={
          onShift
            ? 'Desactiva para dejar de recibir solicitudes cercanas'
            : 'Actívalo para empezar a recibir solicitudes cercanas'
        }
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: theme.touch.min,
        }}
      >
        <View style={{ flex: 1, marginRight: theme.spacing.md }}>
          <Text style={{ ...theme.typography.subtitle, color: theme.colors.text }}>
            {onShift ? 'En turno' : 'Fuera de turno'}
          </Text>
          <Text style={{ ...theme.typography.small, color: theme.colors.textMuted, marginTop: 2 }}>
            {onShift
              ? 'Recibiendo solicitudes cercanas.'
              : 'No recibirás solicitudes mientras esté apagado.'}
          </Text>
        </View>
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          pointerEvents="none"
        >
          <Switch
            value={onShift}
            trackColor={{ false: theme.colors.border, true: theme.colors.brand }}
            thumbColor={theme.colors.surface}
          />
        </View>
      </Pressable>
    </Card>
  );
}

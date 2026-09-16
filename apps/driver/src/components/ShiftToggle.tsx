import React from 'react';
import { ActivityIndicator, Pressable, Switch, Text, View } from 'react-native';
import { Card, useTheme } from '@voyyaa/ui-mobile';

export interface ShiftToggleProps {
  checked: boolean;
  busy: boolean;
  disabled?: boolean;
  onToggle: () => void;
}

export function ShiftToggle({
  checked,
  busy,
  disabled = false,
  onToggle,
}: ShiftToggleProps): React.JSX.Element {
  const theme = useTheme();
  const isInteractive = !busy && !disabled;

  const subtitle = disabled
    ? 'No tienes un vehículo vinculado. Contacta al administrador.'
    : busy
      ? checked
        ? 'Actualizando turno…'
        : 'Activando turno…'
      : checked
        ? 'Recibiendo solicitudes cercanas.'
        : 'No recibirás solicitudes mientras esté apagado.';

  return (
    <Card>
      <Pressable
        onPress={() => {
          if (isInteractive) onToggle();
        }}
        accessibilityRole="switch"
        accessibilityState={{ checked, busy, disabled }}
        aria-busy={busy}
        accessibilityLabel={checked ? 'Turno activado' : 'Turno desactivado'}
        accessibilityHint={
          disabled
            ? 'No tienes un vehículo vinculado'
            : checked
              ? 'Desactiva para dejar de recibir solicitudes cercanas'
              : 'Actívalo para empezar a recibir solicitudes cercanas'
        }
        disabled={!isInteractive}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: theme.touch.min,
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <View style={{ flex: 1, marginRight: theme.spacing.md }}>
          <Text style={{ ...theme.typography.subtitle, color: theme.colors.text }}>
            {checked ? 'En turno' : 'Fuera de turno'}
          </Text>
          <Text style={{ ...theme.typography.small, color: theme.colors.textMuted, marginTop: 2 }}>
            {subtitle}
          </Text>
        </View>
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          pointerEvents="none"
        >
          {busy ? (
            <ActivityIndicator size="small" color={theme.colors.brandInk} />
          ) : (
            <Switch
              value={checked}
              trackColor={{ false: theme.colors.border, true: theme.colors.brand }}
              thumbColor={theme.colors.surface}
            />
          )}
        </View>
      </Pressable>
    </Card>
  );
}

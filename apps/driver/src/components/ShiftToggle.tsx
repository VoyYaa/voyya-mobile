// =============================================================================
// VoyYa Conductor — ShiftToggle
// -----------------------------------------------------------------------------
// Toggle "En turno / Fuera de turno" de Home (§2.5: role="switch", aria-checked,
// descripción del efecto). El `Switch` nativo de RN tiene un tamaño intrínseco
// menor a 44px en algunas plataformas: se envuelve en un `Pressable` que SÍ
// cumple `touch.min` y concentra toda la semántica de accesibilidad; el
// `Switch` interno queda puramente decorativo (mismo patrón que el pulso de
// Skeleton.tsx: `accessibilityElementsHidden` + `pointerEvents="none"`).
// =============================================================================

import React from 'react';
import { Pressable, Switch, Text, View } from 'react-native';
import { Card, useTheme } from '@voyya/ui-mobile';

export interface ShiftToggleProps {
  enTurno: boolean;
  onToggle: (siguiente: boolean) => void;
}

export function ShiftToggle({ enTurno, onToggle }: ShiftToggleProps): React.JSX.Element {
  const theme = useTheme();

  return (
    <Card>
      <Pressable
        onPress={() => onToggle(!enTurno)}
        accessibilityRole="switch"
        accessibilityState={{ checked: enTurno }}
        accessibilityLabel={enTurno ? 'Turno activado' : 'Turno desactivado'}
        accessibilityHint={
          enTurno
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
            {enTurno ? 'En turno' : 'Fuera de turno'}
          </Text>
          <Text style={{ ...theme.typography.small, color: theme.colors.textMuted, marginTop: 2 }}>
            {enTurno
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
            value={enTurno}
            trackColor={{ false: theme.colors.border, true: theme.colors.brand }}
            thumbColor={theme.colors.surface}
          />
        </View>
      </Pressable>
    </Card>
  );
}

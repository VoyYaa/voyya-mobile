// =============================================================================
// VoyYa Pasajero — ServiceTypeSelector
// -----------------------------------------------------------------------------
// Selector de `TipoServicio` (enum reusado de @voyya/shared, sin redefinir).
// REGLA DE ORO DEL MVP (CLAUDE.md): "1 modalidad (taxi)" — moto/confort/envío
// están diferidos a EV1+. Este componente es genérico (puede pintar las 4
// opciones, como el hi-fi aprobado screens-pasajero.jsx/P5), pero quien lo usa
// en este ciclo (app/confirmar.tsx) marca `enabled: false` en las 3 no-taxi:
// se ven (fiel al hi-fi aprobado) pero no son seleccionables ni disparan
// solicitudes — mismo patrón ya usado para métodos de pago "próximamente".
// =============================================================================

import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '@voyya/ui-mobile';
import type { TipoServicio } from '@voyya/shared';

export interface ServiceTypeOption {
  tipo: TipoServicio;
  label: string;
  icon: string;
  enabled: boolean;
}

export interface ServiceTypeSelectorProps {
  options: readonly ServiceTypeOption[];
  selected: TipoServicio;
  onSelect: (tipo: TipoServicio) => void;
}

export function ServiceTypeSelector({ options, selected, onSelect }: ServiceTypeSelectorProps): React.JSX.Element {
  const theme = useTheme();

  return (
    <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
      {options.map((option) => {
        const isSelected = option.tipo === selected;
        return (
          <Pressable
            key={option.tipo}
            disabled={!option.enabled}
            onPress={() => onSelect(option.tipo)}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected, disabled: !option.enabled }}
            accessibilityLabel={option.enabled ? option.label : `${option.label}, próximamente`}
            style={{
              flex: 1,
              minHeight: theme.touch.min,
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: theme.spacing.sm,
              borderRadius: theme.radius.card,
              borderWidth: isSelected ? 2 : 1,
              borderColor: isSelected ? theme.colors.brand : theme.colors.border,
              backgroundColor: isSelected ? theme.colors.surfaceAlt : theme.colors.surface,
              opacity: option.enabled ? 1 : 0.55,
            }}
          >
            <Text style={{ fontSize: 20 }}>{option.icon}</Text>
            <Text style={{ ...theme.typography.small, fontWeight: '600', color: theme.colors.text, marginTop: 2 }}>
              {option.label}
            </Text>
            {!option.enabled && (
              <Text style={{ ...theme.typography.small, color: theme.colors.textMuted, fontSize: 10 }}>Pronto</Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

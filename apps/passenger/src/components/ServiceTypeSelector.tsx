import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '@voyyaa/ui-mobile';
import type { ServiceType } from '@voyyaa/shared';

export interface ServiceTypeOption {
  type: ServiceType;
  label: string;
  icon: string;
  enabled: boolean;
}

export interface ServiceTypeSelectorProps {
  options: readonly ServiceTypeOption[];
  selected: ServiceType;
  onSelect: (type: ServiceType) => void;
}

export function ServiceTypeSelector({ options, selected, onSelect }: ServiceTypeSelectorProps): React.JSX.Element {
  const theme = useTheme();

  return (
    <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
      {options.map((option) => {
        const isSelected = option.type === selected;
        return (
          <Pressable
            key={option.type}
            disabled={!option.enabled}
            onPress={() => onSelect(option.type)}
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

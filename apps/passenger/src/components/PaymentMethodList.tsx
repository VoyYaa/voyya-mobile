import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '@voyyaa/ui-mobile';
import type { PaymentMethod } from '@voyyaa/shared';

export interface PaymentMethodOption {
  method: PaymentMethod;
  label: string;
  sublabel: string;
  enabled: boolean;
}

export interface PaymentMethodListProps {
  options: readonly PaymentMethodOption[];
  selected: PaymentMethod;
  onSelect: (method: PaymentMethod) => void;
}

export function PaymentMethodList({
  options,
  selected,
  onSelect,
}: PaymentMethodListProps): React.JSX.Element {
  const theme = useTheme();

  return (
    <View accessibilityRole="radiogroup" style={{ gap: theme.spacing.sm }}>
      {options.map((option) => {
        const isSelected = option.method === selected;
        return (
          <Pressable
            key={option.method}
            disabled={!option.enabled}
            onPress={() => onSelect(option.method)}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected, disabled: !option.enabled }}
            accessibilityLabel={option.enabled ? option.label : `${option.label}, próximamente`}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              minHeight: theme.touch.min,
              paddingHorizontal: theme.spacing.md,
              borderRadius: theme.radius.field,
              borderWidth: isSelected ? 2 : 1,
              borderColor: isSelected ? theme.colors.brandInk : theme.colors.border,
              backgroundColor: isSelected ? theme.colors.surfaceAlt : theme.colors.surface,
              opacity: option.enabled ? 1 : 0.55,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{ ...theme.typography.body, fontWeight: '600', color: theme.colors.text }}
              >
                {option.label}
                {!option.enabled ? ' · próximamente' : ''}
              </Text>
              <Text style={{ ...theme.typography.small, color: theme.colors.textMuted }}>
                {option.sublabel}
              </Text>
            </View>
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                borderWidth: 2,
                borderColor: theme.colors.text,
                backgroundColor: isSelected ? theme.colors.brand : 'transparent',
              }}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

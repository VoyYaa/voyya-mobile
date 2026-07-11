import React from 'react';
import { Text, View } from 'react-native';
import { Card, Chip, PriceTag, formatCOP, useTheme } from '@voyyaa/ui-mobile';

export interface RequestRowProps {
  passengerName?: string;
  originLabel: string;
  destinationLabel: string;
  distanceKm?: number;
  distanceToPickup: string;
  price: number;
  isNearest?: boolean;
  onPress: () => void;
}

export function RequestRow({
  passengerName,
  originLabel,
  destinationLabel,
  distanceKm,
  distanceToPickup,
  price,
  isNearest = false,
  onPress,
}: RequestRowProps): React.JSX.Element {
  const theme = useTheme();
  const name = passengerName?.trim() || 'Pasajero';
  const initial = name.charAt(0).toUpperCase();
  const spokenPrice = formatCOP(price).replace('$', '');

  return (
    <Card
      tone={isNearest ? 'alt' : 'surface'}
      onPress={onPress}
      accessibilityLabel={`${name}, recoger a ${distanceToPickup}, ${spokenPrice} pesos. Toca para ver el detalle.`}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: theme.colors.brand,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ ...theme.typography.subtitle, color: theme.colors.onBrand }}>
            {initial}
          </Text>
        </View>

        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
            <Text
              style={{
                ...theme.typography.body,
                fontWeight: '600',
                color: theme.colors.text,
                flexShrink: 1,
              }}
              numberOfLines={1}
            >
              {name}
            </Text>
            {isNearest && <Chip label="nuevo" tone="brand" />}
          </View>
          <Text
            style={{ ...theme.typography.small, color: theme.colors.textMuted }}
            numberOfLines={1}
          >
            {originLabel} → {destinationLabel}
          </Text>
          <Text
            style={{ ...theme.typography.small, color: theme.colors.textMuted }}
            numberOfLines={1}
          >
            Recoger a {distanceToPickup}
            {distanceKm !== undefined ? ` · ${distanceKm.toFixed(1)} km` : ''}
          </Text>
        </View>

        <PriceTag amountCOP={price} size="md" />
      </View>
    </Card>
  );
}

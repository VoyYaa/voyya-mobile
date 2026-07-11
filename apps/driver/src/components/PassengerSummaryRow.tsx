import React from 'react';
import { Text, View } from 'react-native';
import { Card, PriceTag, useTheme } from '@voyyaa/ui-mobile';

export interface PassengerSummaryRowProps {
  passengerName?: string;
  price: number;
}

export function PassengerSummaryRow({
  passengerName,
  price,
}: PassengerSummaryRowProps): React.JSX.Element {
  const theme = useTheme();
  const name = passengerName?.trim() || 'Pasajero';
  const initial = name.charAt(0).toUpperCase();

  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: theme.colors.surfaceAlt,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ ...theme.typography.title, color: theme.colors.text }}>{initial}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{ ...theme.typography.subtitle, color: theme.colors.text }}
            numberOfLines={1}
          >
            {name}
          </Text>
        </View>
        <PriceTag amountCOP={price} size="lg" />
      </View>
    </Card>
  );
}

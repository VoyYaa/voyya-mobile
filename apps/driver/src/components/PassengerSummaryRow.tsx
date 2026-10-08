import React from 'react';
import { Text, View } from 'react-native';
import { Card, PriceTag, useTheme } from '@voyyaa/ui-mobile';
import { driverCopy } from '../copy/driver-copy';

export interface PassengerSummaryRowProps {
  passengerName?: string;
  price: number;
}

const AVATAR_SIZE = 48;

export function PassengerSummaryRow({
  passengerName,
  price,
}: PassengerSummaryRowProps): React.JSX.Element {
  const theme = useTheme();
  const name = passengerName?.trim() || driverCopy.trip.passenger;
  const initial = name.charAt(0).toUpperCase();

  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={{
            width: AVATAR_SIZE,
            height: AVATAR_SIZE,
            borderRadius: AVATAR_SIZE / 2,
            backgroundColor: theme.colors.stage,
            borderWidth: 2,
            borderColor: theme.colors.brand,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ ...theme.typography.title, color: theme.colors.onStage }}>{initial}</Text>
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

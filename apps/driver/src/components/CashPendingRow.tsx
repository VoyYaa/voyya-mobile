import React from 'react';
import { Text, View } from 'react-native';
import {
  Button,
  Card,
  PriceTag,
  formatCOP,
  formatShortDateTime,
  useTheme,
} from '@voyyaa/ui-mobile';
import type { PendingCashTrip } from '@voyyaa/shared';

export interface CashPendingRowProps {
  trip: PendingCashTrip;
  loading: boolean;
  disabled: boolean;
  errorMessage?: string;
  onConfirm: () => void;
}

export function CashPendingRow({
  trip,
  loading,
  disabled,
  errorMessage,
  onConfirm,
}: CashPendingRowProps): React.JSX.Element {
  const theme = useTheme();
  const dateLabel = formatShortDateTime(trip.finished_at);

  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1, marginRight: theme.spacing.md }}>
          <Text style={{ ...theme.typography.body, color: theme.colors.text }}>{dateLabel}</Text>
          <Text
            style={{ ...theme.typography.small, color: theme.colors.textMuted }}
            numberOfLines={1}
          >
            {trip.dropoff_address}
          </Text>
        </View>
        <PriceTag amountCOP={trip.fare} size="sm" />
      </View>

      {errorMessage && (
        <Text
          accessibilityRole="alert"
          style={{
            ...theme.typography.small,
            color: theme.colors.dangerInk,
            marginTop: theme.spacing.xs,
          }}
        >
          {errorMessage}
        </Text>
      )}

      <Button
        label="Cobré en efectivo"
        variant="go"
        loading={loading}
        loadingLabel="Confirmando…"
        disabled={disabled}
        accessibilityLabel={`Confirmar cobro del viaje del ${dateLabel}, ${formatCOP(trip.fare)}`}
        onPress={onConfirm}
        style={{ marginTop: theme.spacing.sm }}
      />
    </Card>
  );
}

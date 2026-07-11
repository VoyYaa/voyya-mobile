import React from 'react';
import { Linking, Text, View } from 'react-native';
import { Button, Card, useTheme } from '@voyyaa/ui-mobile';
import type { AssignedDriverSummary } from '@voyyaa/shared';

export interface DriverCardProps {
  driver: AssignedDriverSummary;
}

function formatEta(eta: AssignedDriverSummary['eta']): string {
  if (!eta) return 'Calculando…';
  if (eta.min_minutes === eta.max_minutes) return `~${eta.min_minutes} min`;
  return `${eta.min_minutes}–${eta.max_minutes} min`;
}

export function DriverCard({ driver }: DriverCardProps): React.JSX.Element {
  const theme = useTheme();
  const canCall = Boolean(driver.contact_phone);

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
          <Text style={{ ...theme.typography.title, color: theme.colors.text }}>{driver.name.charAt(0)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ ...theme.typography.subtitle, color: theme.colors.text }} numberOfLines={1}>
            {driver.name}
          </Text>
          <Text style={{ ...theme.typography.small, color: theme.colors.textMuted }}>
            {driver.model ?? 'Vehículo'} · ETA {formatEta(driver.eta)}
          </Text>
        </View>
        <View
          style={{
            backgroundColor: theme.colors.brand,
            borderRadius: theme.radius.field,
            paddingHorizontal: theme.spacing.sm,
            paddingVertical: 4,
          }}
        >
          <Text style={{ ...theme.typography.numeric, fontSize: 14, color: theme.colors.onBrand }}>{driver.plate}</Text>
        </View>
      </View>
      <View style={{ marginTop: theme.spacing.md }}>
        <Button
          label="Llamar"
          variant="ghost"
          disabled={!canCall}
          accessibilityHint={canCall ? undefined : 'Número no disponible todavía'}
          onPress={() => {
            if (driver.contact_phone) {
              void Linking.openURL(`tel:${driver.contact_phone}`);
            }
          }}
        />
      </View>
    </Card>
  );
}

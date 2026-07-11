// =============================================================================
// VoyYa Pasajero — DriverCard
// -----------------------------------------------------------------------------
// Tarjeta de conductor asignado: nombre, placa, modelo, ETA y botón Llamar.
// El ETA se muestra como RANGO estático ("8–12 min"), NUNCA como countdown que
// decrece en el cliente: `EtaEstimado.es_estimado` (contrato @voyya/shared) y
// ADR-003 son explícitos en que no hay tracking GPS en vivo en el MVP — el
// sketch original simula un contador; este build sigue el contrato, no el sketch.
// =============================================================================

import React from 'react';
import { Linking, Text, View } from 'react-native';
import { Button, Card, useTheme } from '@voyya/ui-mobile';
import type { ConductorAsignadoResumen } from '@voyya/shared';

export interface DriverCardProps {
  conductor: ConductorAsignadoResumen;
}

function formatEta(eta: ConductorAsignadoResumen['eta']): string {
  if (!eta) return 'Calculando…';
  if (eta.min_minutos === eta.max_minutos) return `~${eta.min_minutos} min`;
  return `${eta.min_minutos}–${eta.max_minutos} min`;
}

export function DriverCard({ conductor }: DriverCardProps): React.JSX.Element {
  const theme = useTheme();
  const puedeLlamar = Boolean(conductor.telefono_contacto);

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
          <Text style={{ ...theme.typography.title, color: theme.colors.text }}>{conductor.nombre.charAt(0)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ ...theme.typography.subtitle, color: theme.colors.text }} numberOfLines={1}>
            {conductor.nombre}
          </Text>
          <Text style={{ ...theme.typography.small, color: theme.colors.textMuted }}>
            {conductor.modelo ?? 'Vehículo'} · ETA {formatEta(conductor.eta)}
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
          <Text style={{ ...theme.typography.numeric, fontSize: 14, color: theme.colors.onBrand }}>{conductor.placa}</Text>
        </View>
      </View>
      <View style={{ marginTop: theme.spacing.md }}>
        <Button
          label="Llamar"
          variant="ghost"
          disabled={!puedeLlamar}
          accessibilityHint={puedeLlamar ? undefined : 'Número no disponible todavía'}
          onPress={() => {
            if (conductor.telefono_contacto) {
              void Linking.openURL(`tel:${conductor.telefono_contacto}`);
            }
          }}
        />
      </View>
    </Card>
  );
}

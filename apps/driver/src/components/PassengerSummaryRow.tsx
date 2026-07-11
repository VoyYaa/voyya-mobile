// =============================================================================
// VoyYa Conductor — PassengerSummaryRow
// -----------------------------------------------------------------------------
// Fila de pasajero del Detalle (§3.2 punto 3: avatar, nombre, calificación,
// precio). GAP DE CONTRATO: `NotificacionAsignacion` no expone `nombre` ni
// calificación antes de aceptar (ver assignment.ts) — se degrada con un rótulo
// neutro y se OMITE la calificación en vez de mostrar un "★ 4.9" inventado.
// =============================================================================

import React from 'react';
import { Text, View } from 'react-native';
import { Card, PriceTag, useTheme } from '@voyya/ui-mobile';

export interface PassengerSummaryRowProps {
  /** OPCIONAL — ver nota de gap arriba. */
  passengerName?: string;
  price: number;
}

export function PassengerSummaryRow({
  passengerName,
  price,
}: PassengerSummaryRowProps): React.JSX.Element {
  const theme = useTheme();
  const nombre = passengerName?.trim() || 'Pasajero';
  const inicial = nombre.charAt(0).toUpperCase();

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
          <Text style={{ ...theme.typography.title, color: theme.colors.text }}>{inicial}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{ ...theme.typography.subtitle, color: theme.colors.text }}
            numberOfLines={1}
          >
            {nombre}
          </Text>
          {/* Calificación ("★ 4.9 · pasajero frecuente" en el sketch) pendiente:
              no existe el campo en el contrato antes de aceptar — se omite en vez
              de inventar un valor. */}
        </View>
        <PriceTag amountCOP={price} size="lg" />
      </View>
    </Card>
  );
}

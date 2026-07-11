// =============================================================================
// VoyYa Conductor — RequestRow
// -----------------------------------------------------------------------------
// Fila de solicitud cercana (§1.3/§2.4.5 de conductor-solicitud-asignacion.md).
// Presionable como UNA sola unidad accesible (§2.5): una etiqueta compuesta
// (nombre, distancia al punto de recogida, precio), nunca fragmentos sueltos.
//
// GAP DE CONTRATO (comentado también en assignment.api.ts): `NotificacionAsignacion`
// (@voyya/shared) no expone `nombre` del pasajero ni la distancia TOTAL
// origen→destino antes de aceptar — solo `distancia_al_origen_m` (recogida) y
// `tarifa_total`. `passengerName`/`distanceKm` quedan OPCIONALES aquí a
// propósito: se degrada con un rótulo neutro en vez de inventar un dato falso.
// Reportar a `arquitectura` si el negocio quiere mostrar nombre/distancia total
// antes de la aceptación.
// =============================================================================

import React from 'react';
import { Text, View } from 'react-native';
import { Card, Chip, PriceTag, formatCOP, useTheme } from '@voyya/ui-mobile';

export interface RequestRowProps {
  /** OPCIONAL — ver nota de gap arriba. */
  passengerName?: string;
  originLabel: string;
  destinationLabel: string;
  /** OPCIONAL — ver nota de gap arriba (no está en el contrato hoy). */
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
  const nombre = passengerName?.trim() || 'Pasajero';
  const inicial = nombre.charAt(0).toUpperCase();
  const precioHablado = formatCOP(price).replace('$', '');

  return (
    <Card
      tone={isNearest ? 'alt' : 'surface'}
      onPress={onPress}
      accessibilityLabel={`${nombre}, recoger a ${distanceToPickup}, ${precioHablado} pesos. Toca para ver el detalle.`}
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
            {inicial}
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
              {nombre}
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

// =============================================================================
// VoyYa Conductor — AssignmentRulesCard
// -----------------------------------------------------------------------------
// Tarjeta informativa "Reglas de asignación" (§2.2 punto 4 / §2.7 copy). Los
// valores vienen de `parametros_sistema` vía el payload del servidor cuando hay
// una solicitud notificada; si aún no hay ninguna (lista vacía / Home), se usa
// el fallback documentado en constants/parametros.ts — NUNCA un literal nuevo
// aquí (DoD §4: "Ninguna solicitud usa 15 o 2 como literal").
// =============================================================================

import React from 'react';
import { Text } from 'react-native';
import { Card, useTheme } from '@voyya/ui-mobile';

export interface AssignmentRulesCardProps {
  radioKm: number;
  timeoutSeg: number;
}

export function AssignmentRulesCard({
  radioKm,
  timeoutSeg,
}: AssignmentRulesCardProps): React.JSX.Element {
  const theme = useTheme();

  return (
    <Card tone="alt">
      <Text style={{ ...theme.typography.small, fontWeight: '600', color: theme.colors.text }}>
        Reglas de asignación
      </Text>
      <Text style={{ ...theme.typography.small, color: theme.colors.textMuted, marginTop: 2 }}>
        Mostradas por cercanía · radio {radioKm} km · timeout {timeoutSeg} s por conductor
      </Text>
    </Card>
  );
}

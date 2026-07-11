// =============================================================================
// VoyYa Conductor — OffShiftPanel
// -----------------------------------------------------------------------------
// Variante BLOQUEANTE "fuera de turno" (§2.4.2) — deliberadamente distinta del
// estado "vacío" (§2.4.3): aquí no hubo fetch (no se llama al servidor mientras
// `enTurno === false`, ver useSolicitudesCercanas.ts), es una decisión reversible
// del propio conductor. Tono `neutral` (nunca `danger` — §1.2).
// =============================================================================

import React from 'react';
import { EmptyState } from '@voyya/ui-mobile';

export interface OffShiftPanelProps {
  onActivar: () => void;
}

export function OffShiftPanel({ onActivar }: OffShiftPanelProps): React.JSX.Element {
  return (
    <EmptyState
      icon="💤"
      title="Estás fuera de turno"
      body="Actívalo para empezar a recibir solicitudes cercanas."
      primaryAction={{ label: 'Activar turno', onPress: onActivar }}
    />
  );
}

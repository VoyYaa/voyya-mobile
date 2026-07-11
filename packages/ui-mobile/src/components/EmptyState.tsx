// =============================================================================
// VoyYa — EmptyState (packages/ui-mobile)
// -----------------------------------------------------------------------------
// "Nada que mostrar todavía" — nunca `danger` (ver principio de severidad en
// pasajero-estados-borde.md §1 y conductor-solicitud-asignacion.md §1.2).
// Ej.: sin conductor disponible, sin solicitudes cercanas, fuera de turno.
// =============================================================================

import React from 'react';
import { StatePanel, type StatePanelAction } from './StatePanel';

export interface EmptyStateProps {
  icon?: string;
  title: string;
  body?: string;
  primaryAction?: StatePanelAction;
  secondaryAction?: StatePanelAction;
}

export function EmptyState(props: EmptyStateProps): React.JSX.Element {
  return <StatePanel {...props} accessibilityRole="none" />;
}

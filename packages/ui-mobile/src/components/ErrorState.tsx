// =============================================================================
// VoyYa — ErrorState (packages/ui-mobile)
// -----------------------------------------------------------------------------
// "Algo falló y hay algo que decidir" (reintentar) — distinto de EmptyState:
// usa `role="alert"` porque exige una acción del usuario, no es solo
// informativo (conductor-solicitud-asignacion.md §3.6).
// =============================================================================

import React from 'react';
import { StatePanel } from './StatePanel';

export interface ErrorStateProps {
  title: string;
  body?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorState({ title, body, onRetry, retryLabel = 'Reintentar' }: ErrorStateProps): React.JSX.Element {
  return (
    <StatePanel
      icon="⚠️"
      title={title}
      body={body}
      accessibilityRole="alert"
      primaryAction={onRetry ? { label: retryLabel, onPress: onRetry, variant: 'primary' } : undefined}
    />
  );
}

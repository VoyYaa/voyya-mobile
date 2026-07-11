import React from 'react';
import { EmptyState } from '@voyyaa/ui-mobile';

export interface OffShiftPanelProps {
  onActivate: () => void;
}

export function OffShiftPanel({ onActivate }: OffShiftPanelProps): React.JSX.Element {
  return (
    <EmptyState
      icon="💤"
      title="Estás fuera de turno"
      body="Actívalo para empezar a recibir solicitudes cercanas."
      primaryAction={{ label: 'Activar turno', onPress: onActivate }}
    />
  );
}

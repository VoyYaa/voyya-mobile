import React from 'react';
import { LocationConsentSheet as BaseLocationConsentSheet } from '@voyyaa/ui-mobile';

export type LocationConsentSheetMode = 'consent' | 'review';

export interface LocationConsentSheetProps {
  visible: boolean;
  mode: LocationConsentSheetMode;
  onContinue: () => void;
  onDismiss: () => void;
}

const ROWS = [
  { label: 'Qué usamos', value: 'Tu ubicación aproximada, al abrir la app.' },
  {
    label: 'Para qué',
    value: 'Para confirmar que estás en zona de cobertura y ubicarte en el mapa al pedir tu taxi.',
  },
  { label: 'Cuánto la guardamos', value: 'Queda asociada al historial de tus viajes.' },
  {
    label: 'Si dices que no',
    value:
      'Igual puedes pedir tu taxi: marcas el punto de recogida en el mapa. Puedes cambiar de opinión cuando quieras, desde los ajustes de tu teléfono.',
  },
] as const;

export function LocationConsentSheet({
  visible,
  mode,
  onContinue,
  onDismiss,
}: LocationConsentSheetProps): React.JSX.Element {
  const isReview = mode === 'review';

  return (
    <BaseLocationConsentSheet
      visible={visible}
      title="Antes de mostrar tu ubicación"
      rows={ROWS}
      primaryLabel={isReview ? 'Entendido' : 'Continuar'}
      secondaryLabel={isReview ? undefined : 'Ahora no'}
      onPrimary={isReview ? onDismiss : onContinue}
      onSecondary={isReview ? undefined : onDismiss}
    />
  );
}

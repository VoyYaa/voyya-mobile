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
  { label: 'Qué usamos', value: 'Tu ubicación aproximada, mientras estás en turno.' },
  { label: 'Para qué', value: 'Para asignarte los viajes más cercanos a ti.' },
  {
    label: 'Cuánto la guardamos',
    value:
      'Se borra apenas terminas turno. Si no cierras turno, se borra sola después de un tiempo.',
  },
  {
    label: 'Cómo la quitas',
    value: 'Cuando quieras, desde los ajustes de ubicación de tu teléfono.',
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
      title="Antes de activar tu turno"
      rows={ROWS}
      primaryLabel={isReview ? 'Entendido' : 'Continuar'}
      secondaryLabel={isReview ? undefined : 'Ahora no'}
      onPrimary={isReview ? onDismiss : onContinue}
      onSecondary={isReview ? undefined : onDismiss}
    />
  );
}

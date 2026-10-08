import React from 'react';
import { LocationConsentSheet as BaseLocationConsentSheet } from '@voyyaa/ui-mobile';
import { passengerCopy } from '../copy/passenger-copy';

export type LocationConsentSheetMode = 'consent' | 'review';

export interface LocationConsentSheetProps {
  visible: boolean;
  mode: LocationConsentSheetMode;
  onContinue: () => void;
  onDismiss: () => void;
}

export function LocationConsentSheet({
  visible,
  mode,
  onContinue,
  onDismiss,
}: LocationConsentSheetProps): React.JSX.Element {
  const isReview = mode === 'review';
  const copy = passengerCopy.locationConsent;

  return (
    <BaseLocationConsentSheet
      visible={visible}
      title={copy.title}
      rows={copy.rows}
      primaryLabel={isReview ? copy.understood : copy.continue}
      secondaryLabel={isReview ? undefined : copy.notNow}
      onPrimary={isReview ? onDismiss : onContinue}
      onSecondary={isReview ? undefined : onDismiss}
    />
  );
}

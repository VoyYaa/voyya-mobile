import React, { useEffect } from 'react';
import { LocationConsentSheet as BaseLocationConsentSheet } from '@voyyaa/ui-mobile';
import { LOCATION_NOTICES } from '@voyyaa/shared';
import { useGrantLocationConsent } from '@voyyaa/app-runtime';
import { driverCopy } from '../copy/driver-copy';

export type LocationConsentSheetMode = 'shift' | 'accept' | 'read';

export interface LocationConsentSheetProps {
  visible: boolean;
  mode: LocationConsentSheetMode;
  onAccepted: () => void;
  onDismiss: () => void;
}

const NOTICE = LOCATION_NOTICES.driver;
const NOTICE_ROWS = NOTICE.rows.map(({ label, value }) => ({ label, value }));
const FACT_ROWS = driverCopy.consentNotice.facts.map(({ label, value }) => ({ label, value }));
const ERROR_ROW = {
  label: driverCopy.consentNotice.errorLabel,
  value: driverCopy.consentNotice.errorValue,
};

export function LocationConsentSheet({
  visible,
  mode,
  onAccepted,
  onDismiss,
}: LocationConsentSheetProps): React.JSX.Element {
  const copy = driverCopy.consentNotice;
  const grant = useGrantLocationConsent();
  const reset = grant.reset;
  const isRead = mode === 'read';
  const noticeRows = isRead ? NOTICE_ROWS : [...FACT_ROWS, ...NOTICE_ROWS];

  useEffect(() => {
    if (!visible) reset();
  }, [visible, reset]);

  const handleAccept = (): void => {
    if (grant.isPending) return;
    grant.mutate(undefined, { onSuccess: onAccepted });
  };

  const primaryLabel = grant.isPending
    ? copy.saving
    : grant.isError
      ? copy.retry
      : isRead
        ? copy.primaryRead
        : mode === 'shift'
          ? copy.primaryShift
          : copy.primaryAccept;

  return (
    <BaseLocationConsentSheet
      visible={visible}
      title={NOTICE.title}
      rows={grant.isError ? [ERROR_ROW, ...noticeRows] : noticeRows}
      primaryLabel={primaryLabel}
      secondaryLabel={isRead || grant.isPending ? undefined : copy.secondary}
      onPrimary={isRead ? onDismiss : handleAccept}
      onSecondary={isRead || grant.isPending ? undefined : onDismiss}
      testID="location-consent-sheet"
    />
  );
}

import React from 'react';
import { Linking } from 'react-native';
import { LocationConsentSheet as BaseLocationConsentSheet, uiCopy } from '@voyyaa/ui-mobile';
import { DATA_CONTROLLER, LOCATION_NOTICES } from '@voyyaa/shared';
import { passengerCopy } from '../copy/passenger-copy';

export type LocationConsentSheetMode = 'consent' | 'review';

export interface LocationConsentSheetProps {
  visible: boolean;
  mode: LocationConsentSheetMode;
  onContinue: () => void;
  onDismiss: () => void;
  loading?: boolean;
  errorMessage?: string;
  testID?: string;
}

const NOTICE = LOCATION_NOTICES.passenger;
const HAS_REAL_POLICY_URL = /^https?:\/\//.test(DATA_CONTROLLER.privacy_policy_url);

export function LocationConsentSheet({
  visible,
  mode,
  onContinue,
  onDismiss,
  loading = false,
  errorMessage,
  testID = 'location-consent-sheet',
}: LocationConsentSheetProps): React.JSX.Element {
  const isReview = mode === 'review';
  const copy = passengerCopy.locationConsent;

  return (
    <BaseLocationConsentSheet
      visible={visible}
      title={NOTICE.title}
      rows={NOTICE.rows}
      primaryLabel={isReview ? copy.understood : copy.accept}
      primaryLoading={loading}
      primaryLoadingLabel={uiCopy.loading}
      secondaryLabel={isReview ? undefined : copy.notNow}
      errorMessage={errorMessage}
      linkRow={
        HAS_REAL_POLICY_URL
          ? {
              label: copy.fullPolicy,
              accessibilityHint: copy.fullPolicyHint,
              onPress: () => void Linking.openURL(DATA_CONTROLLER.privacy_policy_url),
            }
          : undefined
      }
      onPrimary={isReview ? onDismiss : onContinue}
      onSecondary={isReview ? undefined : onDismiss}
      testID={testID}
    />
  );
}

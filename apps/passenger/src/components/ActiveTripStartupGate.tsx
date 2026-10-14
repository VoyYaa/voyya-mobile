import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  BrandLoader,
  ErrorState,
  LinkButton,
  OfflineState,
  useDelayedLoading,
  useTheme,
} from '@voyyaa/ui-mobile';
import type { ActiveTripStartup } from '../hooks/useActiveTripStartup';
import type { NotificationTapState } from '../hooks/usePassengerNotificationRouting';
import { passengerCopy } from '../copy/passenger-copy';

const copy = passengerCopy.activeTrip;

export interface ActiveTripStartupGateProps {
  startup: ActiveTripStartup;
  tap: NotificationTapState;
}

export function ActiveTripStartupGate({
  startup,
  tap,
}: ActiveTripStartupGateProps): React.JSX.Element | null {
  const theme = useTheme();
  const opening = tap.phase === 'resolving';
  const checking = startup.phase === 'checking' || opening;
  const showLoader = useDelayedLoading(checking);

  const failedSource =
    startup.phase === 'offline' || startup.phase === 'error'
      ? { phase: startup.phase, retry: startup.retry, skip: startup.skip }
      : tap.phase === 'offline' || tap.phase === 'error'
        ? { phase: tap.phase, retry: tap.retry, skip: tap.skip }
        : null;

  if (failedSource === null && !checking) return null;

  if (failedSource === null) {
    return (
      <View
        testID="active-trip-checking"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: theme.colors.stage,
        }}
      >
        {showLoader && (
          <BrandLoader variant="screen" label={opening ? copy.opening : copy.checking} />
        )}
      </View>
    );
  }

  return (
    <SafeAreaView
      testID="active-trip-startup-failed"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: theme.colors.bg,
        justifyContent: 'center',
      }}
    >
      {failedSource.phase === 'offline' ? (
        <OfflineState
          title={copy.offlineTitle}
          body={copy.offlineBody}
          onRetry={failedSource.retry}
        />
      ) : (
        <ErrorState title={copy.errorTitle} body={copy.errorBody} onRetry={failedSource.retry} />
      )}
      <View style={{ alignItems: 'center' }}>
        <LinkButton
          label={copy.continueHome}
          tone="muted"
          onPress={failedSource.skip}
          testID="active-trip-skip"
        />
      </View>
    </SafeAreaView>
  );
}

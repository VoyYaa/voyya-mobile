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
import { startupGateView } from '../lib/startup-gate-view';
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
  const view = startupGateView(startup, tap);
  const showLoader = useDelayedLoading(view.kind === 'veil');

  if (view.kind === 'none') return null;

  if (view.kind === 'veil') {
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
          <BrandLoader
            variant="screen"
            label={view.label === 'opening' ? copy.opening : copy.checking}
          />
        )}
      </View>
    );
  }

  const failedSource = view.source === 'startup' ? startup : tap;

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
      {view.phase === 'offline' ? (
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

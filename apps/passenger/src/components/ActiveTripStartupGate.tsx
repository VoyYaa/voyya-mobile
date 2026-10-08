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
import { useActiveTripStartup } from '../hooks/useActiveTripStartup';
import { passengerCopy } from '../copy/passenger-copy';

const copy = passengerCopy.activeTrip;

export function ActiveTripStartupGate(): React.JSX.Element | null {
  const theme = useTheme();
  const { phase, retry, skip } = useActiveTripStartup();
  const showLoader = useDelayedLoading(phase === 'checking');

  if (phase === 'idle' || phase === 'done') return null;

  if (phase === 'checking') {
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
        {showLoader && <BrandLoader variant="screen" label={copy.checking} />}
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
      {phase === 'offline' ? (
        <OfflineState title={copy.offlineTitle} body={copy.offlineBody} onRetry={retry} />
      ) : (
        <ErrorState title={copy.errorTitle} body={copy.errorBody} onRetry={retry} />
      )}
      <View style={{ alignItems: 'center' }}>
        <LinkButton
          label={copy.continueHome}
          tone="muted"
          onPress={skip}
          testID="active-trip-skip"
        />
      </View>
    </SafeAreaView>
  );
}

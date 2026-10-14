import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BRAND_FONT_ASSETS, BootScreen, ThemeProvider, useTheme } from '@voyyaa/ui-mobile';
import { ANDROID_ASSIGNMENT_CHANNEL_ID, AssignmentError } from '@voyyaa/shared';
import {
  configureApiClient,
  configurePushNotifications,
  createQueryClient,
  ConnectivityBanner,
  refreshLocationConsent,
  useSessionStore,
  silenceKnownWebWarnings,
  useProactiveRefresh,
  usePushRegistration,
} from '@voyyaa/app-runtime';
import { useRouteGuard } from '../src/hooks/useRouteGuard';
import { API_BASE_URL } from '../src/constants/env';
import { ensureAssignmentNotificationChannel } from '../src/notifications/notification-channel';
import { useNotificationRouting } from '../src/notifications/useNotificationRouting';
import { useTripLocationSharing } from '../src/hooks/useTripLocationSharing';
import '../src/tracking/trip-location-task';

configureApiClient({ baseUrl: API_BASE_URL, defaultErrorSchema: AssignmentError });
configurePushNotifications({
  channel: { id: ANDROID_ASSIGNMENT_CHANNEL_ID, ensure: ensureAssignmentNotificationChannel },
  supportedPlatforms: ['android', 'ios'],
  askPermissionOnSync: true,
});
silenceKnownWebWarnings();
void SplashScreen.preventAutoHideAsync().catch(() => undefined);

interface RootStackProps {
  fontsSettled: boolean;
}

function RootStack({ fontsSettled }: RootStackProps): React.JSX.Element {
  const theme = useTheme();
  const [bootDone, setBootDone] = useState(false);
  const status = useSessionStore((s) => s.status);
  const hydrate = useSessionStore((s) => s.hydrate);

  useEffect(() => {
    void hydrate();
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      void refreshLocationConsent().catch(() => undefined);
    }
  }, [status]);

  useRouteGuard();
  useProactiveRefresh();
  usePushRegistration();
  useNotificationRouting();
  useTripLocationSharing();

  const hideSplash = (): void => {
    void SplashScreen.hideAsync().catch(() => undefined);
  };

  return (
    <>
      <StatusBar style={bootDone && theme.mode === 'light' ? 'dark' : 'light'} />
      {status !== 'hydrating' && (
        <>
          <ConnectivityBanner />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: theme.colors.bg },
            }}
          />
        </>
      )}
      {!bootDone && (
        <BootScreen
          target="car"
          ready={fontsSettled && status !== 'hydrating'}
          onFirstFrame={hideSplash}
          onDone={() => setBootDone(true)}
        />
      )}
    </>
  );
}

export default function RootLayout(): React.JSX.Element {
  const [queryClient] = useState(createQueryClient);
  const [fontsLoaded, fontError] = useFonts(BRAND_FONT_ASSETS);

  return (
    <SafeAreaProvider>
      <ThemeProvider fontsReady={fontsLoaded}>
        <QueryClientProvider client={queryClient}>
          <RootStack fontsSettled={fontsLoaded || fontError !== null} />
        </QueryClientProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

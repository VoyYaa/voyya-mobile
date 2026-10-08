import React, { useEffect, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BRAND_FONT_ASSETS, BootScreen, ThemeProvider, useTheme } from '@voyyaa/ui-mobile';
import { AssignmentError, LOCATION_NOTICE_VERSION } from '@voyyaa/shared';
import {
  configureApiClient,
  createQueryClient,
  ConnectivityBanner,
  retryPendingConsentSync,
  useSessionStore,
  silenceKnownWebWarnings,
  useProactiveRefresh,
} from '@voyyaa/app-runtime';
import { useRouteGuard } from '../src/hooks/useRouteGuard';
import { API_BASE_URL } from '../src/constants/env';
import { registerForPushNotifications } from '../src/notifications/push-registration';
import { useNotificationRouting } from '../src/notifications/useNotificationRouting';

configureApiClient({ baseUrl: API_BASE_URL, defaultErrorSchema: AssignmentError });
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
      void retryPendingConsentSync('location', LOCATION_NOTICE_VERSION);
      void registerForPushNotifications();
    }
  }, [status]);

  useEffect(() => {
    if (status !== 'authenticated') return;

    const subscription = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'active') {
        void registerForPushNotifications();
      }
    });
    return () => subscription.remove();
  }, [status]);

  useRouteGuard();
  useProactiveRefresh();
  useNotificationRouting();

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

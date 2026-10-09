import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BRAND_FONT_ASSETS, BootScreen, ThemeProvider, useTheme } from '@voyyaa/ui-mobile';
import { TripError } from '@voyyaa/shared';
import {
  configureApiClient,
  createQueryClient,
  ConnectivityBanner,
  refreshLocationConsent,
  useSessionStore,
  silenceKnownWebWarnings,
  useProactiveRefresh,
} from '@voyyaa/app-runtime';
import { ActiveTripStartupGate } from '../src/components/ActiveTripStartupGate';
import { useRouteGuard } from '../src/hooks/useRouteGuard';
import { wipeStartCodeOnFreshInstall } from '../src/lib/start-code-runtime';
import { API_BASE_URL } from '../src/constants/env';

configureApiClient({ baseUrl: API_BASE_URL, defaultErrorSchema: TripError });
silenceKnownWebWarnings();
SplashScreen.preventAutoHideAsync().catch(() => undefined);

interface RootStackProps {
  fontsSettled: boolean;
}

function RootStack({ fontsSettled }: RootStackProps): React.JSX.Element {
  const theme = useTheme();
  const status = useSessionStore((s) => s.status);
  const hydrate = useSessionStore((s) => s.hydrate);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    void wipeStartCodeOnFreshInstall();
    void hydrate();
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      void refreshLocationConsent().catch(() => undefined);
    }
  }, [status]);

  useRouteGuard();
  useProactiveRefresh();

  const hideSplash = useCallback((): void => {
    SplashScreen.hideAsync().catch(() => undefined);
  }, []);

  const hydrating = status === 'hydrating';

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
      {!hydrating && (
        <>
          <ConnectivityBanner />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: theme.colors.bg },
            }}
          >
            <Stack.Screen name="index" options={{ animation: 'fade' }} />
            <Stack.Screen name="searching" options={{ animation: 'fade', gestureEnabled: false }} />
            <Stack.Screen
              name="driver-assigned"
              options={{ animation: 'fade', gestureEnabled: false }}
            />
          </Stack>
          <ActiveTripStartupGate />
        </>
      )}
      {booting && (
        <BootScreen
          target="person"
          ready={fontsSettled && !hydrating}
          onFirstFrame={hideSplash}
          onDone={() => setBooting(false)}
        />
      )}
    </View>
  );
}

export default function RootLayout(): React.JSX.Element {
  const [queryClient] = useState(createQueryClient);
  const [fontsLoaded, fontsError] = useFonts(BRAND_FONT_ASSETS);

  return (
    <SafeAreaProvider>
      <ThemeProvider fontsReady={fontsLoaded}>
        <QueryClientProvider client={queryClient}>
          <RootStack fontsSettled={fontsLoaded || fontsError !== null} />
        </QueryClientProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

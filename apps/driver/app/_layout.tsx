import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '@voyyaa/ui-mobile';
import { AssignmentError, LOCATION_NOTICE_VERSION } from '@voyyaa/shared';
import {
  configureApiClient,
  createQueryClient,
  ConnectivityBanner,
  retryPendingConsentSync,
  useSessionStore,
  useProactiveRefresh,
} from '@voyyaa/app-runtime';
import { useRouteGuard } from '../src/hooks/useRouteGuard';
import { API_BASE_URL } from '../src/constants/env';

configureApiClient({ baseUrl: API_BASE_URL, defaultErrorSchema: AssignmentError });

function RootStack(): React.JSX.Element {
  const theme = useTheme();
  const status = useSessionStore((s) => s.status);
  const hydrate = useSessionStore((s) => s.hydrate);

  useEffect(() => {
    void hydrate();
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      void retryPendingConsentSync('location', LOCATION_NOTICE_VERSION);
    }
  }, [status]);

  useRouteGuard();
  useProactiveRefresh();

  if (status === 'hydrating') {
    return <View style={{ flex: 1, backgroundColor: theme.colors.bg }} />;
  }

  return (
    <>
      <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
      <ConnectivityBanner />
      <Stack
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.bg } }}
      />
    </>
  );
}

export default function RootLayout(): React.JSX.Element {
  const [queryClient] = useState(createQueryClient);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <RootStack />
        </QueryClientProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

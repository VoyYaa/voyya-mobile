import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '@voyyaa/ui-mobile';
import { createQueryClient } from '../src/lib/query-client';
import { ConnectivityBanner } from '../src/components/ConnectivityBanner';
import { useSessionStore } from '../src/state/useSessionStore';
import { useRouteGuard } from '../src/hooks/useRouteGuard';
import { useProactiveRefresh } from '../src/hooks/useProactiveRefresh';

function RootStack(): React.JSX.Element {
  const theme = useTheme();
  const status = useSessionStore((s) => s.status);
  const hydrate = useSessionStore((s) => s.hydrate);

  useEffect(() => {
    void hydrate();
  }, []);

  useRouteGuard();
  useProactiveRefresh();

  if (status === 'hydrating') {
    return <View style={{ flex: 1, backgroundColor: theme.colors.bg }} />;
  }

  return (
    <>
      <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
      <ConnectivityBanner />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.bg } }} />
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

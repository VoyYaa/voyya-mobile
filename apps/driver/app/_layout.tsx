// =============================================================================
// VoyYa Conductor — Root layout (expo-router)
// -----------------------------------------------------------------------------
// Providers globales: QueryClient (TanStack), ThemeProvider (@voyya/ui-mobile,
// respeta el modo del sistema) y SafeAreaProvider. El <ConnectivityBanner/> se
// monta UNA vez aquí para que Home/Solicitudes/Detalle compartan el mismo
// banner "sin conexión" (mismo patrón que apps/passenger/app/_layout.tsx).
//
// SESIÓN: `hydrate()` lee expo-secure-store una sola vez al arrancar; mientras
// `status==='hydrating'` se muestra un fondo simple (evita parpadear a login
// antes de saber si ya había sesión). `useRouteGuard`/`useProactiveRefresh`
// quedan montados durante toda la vida de la app (auth-login-otp.md, D-A04).
// =============================================================================

import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '@voyya/ui-mobile';
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
    // Deliberadamente solo se ejecuta al montar: `hydrate` es una acción
    // estable de Zustand (mismo criterio que otros efectos "una sola vez" del
    // repo, p.ej. apps/passenger/app/destino.tsx).
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

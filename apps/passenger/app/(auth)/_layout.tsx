// =============================================================================
// VoyYa Pasajero — Layout del grupo (auth)
// -----------------------------------------------------------------------------
// Stack propio para Teléfono/OTP (HU-AUTH-01). El grupo `(auth)` no aparece en
// la URL (convención de expo-router) — solo se usa para que useRouteGuard.ts
// distinga "estoy en el flujo de acceso" comparando `segments[0] === '(auth)'`.
// =============================================================================

import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '@voyya/ui-mobile';

export default function AuthLayout(): React.JSX.Element {
  const theme = useTheme();
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.bg } }} />;
}

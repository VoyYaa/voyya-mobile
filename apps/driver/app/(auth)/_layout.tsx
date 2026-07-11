import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '@voyyaa/ui-mobile';

export default function AuthLayout(): React.JSX.Element {
  const theme = useTheme();
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.bg } }} />;
}

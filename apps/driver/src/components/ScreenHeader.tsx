// =============================================================================
// VoyYa Conductor — ScreenHeader
// -----------------------------------------------------------------------------
// Mismo patrón que apps/passenger/src/components/ScreenHeader.tsx. No vive en
// `packages/ui-mobile` porque acopla `expo-router` (específico de cada app).
// `hideBack`: usado por el Detalle+countdown mientras `status === 'contando'`
// (§3.6 — el título comunica que la única salida es decidir, no un back "vacío").
// =============================================================================

import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '@voyya/ui-mobile';
import { useRouter } from 'expo-router';

export interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  hideBack?: boolean;
  right?: React.ReactNode;
}

export function ScreenHeader({
  title,
  onBack,
  hideBack = false,
  right,
}: ScreenHeaderProps): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const handleBack = onBack ?? (() => router.back());

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.sm,
        minHeight: 56,
      }}
    >
      <View style={{ width: theme.touch.min }}>
        {!hideBack && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver"
            onPress={handleBack}
            hitSlop={8}
            style={{
              width: theme.touch.min,
              height: theme.touch.min,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ ...theme.typography.title, color: theme.colors.text }}>←</Text>
          </Pressable>
        )}
      </View>
      <Text
        accessibilityRole="header"
        numberOfLines={1}
        style={{
          ...theme.typography.subtitle,
          color: theme.colors.text,
          flex: 1,
          textAlign: 'center',
        }}
      >
        {title}
      </Text>
      <View style={{ width: theme.touch.min, alignItems: 'flex-end' }}>{right}</View>
    </View>
  );
}

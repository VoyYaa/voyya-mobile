// =============================================================================
// VoyYa — Card (packages/ui-mobile)
// -----------------------------------------------------------------------------
// Contenedor de superficie base: filas, resúmenes, tarjetas de estado. `tone`
// controla el fondo ("surface" por defecto, "alt" para resaltar — p.ej. tarifa
// destacada o fila "más cercana").
// =============================================================================

import React from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../theme';

export interface CardProps {
  children: React.ReactNode;
  tone?: 'surface' | 'alt';
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  testID?: string;
}

export function Card({ children, tone = 'surface', onPress, style, accessibilityLabel, testID }: CardProps): React.JSX.Element {
  const theme = useTheme();
  const backgroundColor = tone === 'alt' ? theme.colors.surfaceAlt : theme.colors.surface;

  const content = (
    <View
      style={[
        {
          backgroundColor,
          borderRadius: theme.radius.card,
          padding: theme.spacing.lg,
          borderWidth: 1,
          borderColor: theme.colors.border,
          ...theme.shadow.sm,
        },
        style,
      ]}
    >
      {children}
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
    >
      {content}
    </Pressable>
  );
}

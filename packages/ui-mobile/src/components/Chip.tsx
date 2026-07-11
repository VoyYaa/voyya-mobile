// =============================================================================
// VoyYa — Chip (packages/ui-mobile)
// -----------------------------------------------------------------------------
// Pastilla pequeña: lugares sugeridos, tag "nuevo", chip de cancelación gratis.
// Visualmente compacta (pill), pero cuando es interactiva expande su área
// táctil con `hitSlop` para acercarse al mínimo de 44px sin agrandar el chip.
// =============================================================================

import React from 'react';
import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../theme';

export type ChipTone = 'neutral' | 'brand' | 'success' | 'danger';

export interface ChipProps {
  label: string;
  tone?: ChipTone;
  selected?: boolean;
  onPress?: () => void;
  /** Emoji/ícono corto antepuesto (ej. "🏠"). */
  leading?: string;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export function Chip({
  label,
  tone = 'neutral',
  selected = false,
  onPress,
  leading,
  style,
  accessibilityLabel,
}: ChipProps): React.JSX.Element {
  const theme = useTheme();

  const toneColors: Record<ChipTone, { bg: string; fg: string }> = {
    neutral: { bg: theme.colors.surfaceAlt, fg: theme.colors.text },
    brand: { bg: theme.colors.brand, fg: theme.colors.onBrand },
    success: { bg: theme.colors.success, fg: theme.colors.onSuccess },
    danger: { bg: theme.colors.dangerTint, fg: theme.colors.danger },
  };
  const palette = toneColors[selected ? 'brand' : tone];

  const Container = onPress ? Pressable : View;

  return (
    <Container
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={onPress ? { selected } : undefined}
      onPress={onPress}
      hitSlop={onPress ? { top: 6, bottom: 6, left: 6, right: 6 } : undefined}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          minHeight: 32,
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.xs,
          borderRadius: theme.radius.pill,
          backgroundColor: palette.bg,
        },
        style,
      ]}
    >
      <Text style={{ ...theme.typography.small, color: palette.fg, fontWeight: '600' }}>
        {leading ? `${leading} ${label}` : label}
      </Text>
    </Container>
  );
}

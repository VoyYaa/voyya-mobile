// =============================================================================
// VoyYa — StatusBadge (packages/ui-mobile)
// -----------------------------------------------------------------------------
// Insignia corta de estado. Tonos: go (verde/éxito), warn (ámbar/en curso),
// danger (rojo/falla). El color NUNCA es el único portador de significado: el
// texto siempre acompaña (ver checklists de ux-ui-estados en ambas specs UX).
// =============================================================================

import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../theme';

export type StatusBadgeTone = 'go' | 'warn' | 'danger';

export interface StatusBadgeProps {
  label: string;
  tone: StatusBadgeTone;
}

export function StatusBadge({ label, tone }: StatusBadgeProps): React.JSX.Element {
  const theme = useTheme();

  const toneColors: Record<StatusBadgeTone, { bg: string; fg: string }> = {
    go: { bg: theme.colors.success, fg: theme.colors.onSuccess },
    warn: { bg: theme.colors.brand, fg: theme.colors.onBrand },
    danger: { bg: theme.colors.dangerTint, fg: theme.colors.danger },
  };
  const palette = toneColors[tone];

  return (
    <View
      style={{
        alignSelf: 'flex-start',
        backgroundColor: palette.bg,
        borderRadius: theme.radius.pill,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 4,
      }}
    >
      <Text style={{ ...theme.typography.small, fontWeight: '700', color: palette.fg }}>{label}</Text>
    </View>
  );
}

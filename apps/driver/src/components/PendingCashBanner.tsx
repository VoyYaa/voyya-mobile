import React from 'react';
import { Pressable, Text } from 'react-native';
import { useTheme } from '@voyyaa/ui-mobile';

export interface PendingCashBannerProps {
  count: number;
  onPress: () => void;
}

export function PendingCashBanner({
  count,
  onPress,
}: PendingCashBannerProps): React.JSX.Element | null {
  const theme = useTheme();

  if (count <= 0) return null;

  const label =
    count === 1
      ? 'Tienes 1 viaje sin confirmar el cobro.'
      : `Tienes ${count} viajes sin confirmar el cobro.`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityLiveRegion="polite"
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: theme.touch.min,
        backgroundColor: theme.colors.dangerTint,
        borderRadius: theme.radius.card,
        paddingHorizontal: theme.spacing.lg,
      }}
    >
      <Text style={{ ...theme.typography.body, color: theme.colors.dangerInk, flex: 1 }}>
        {label}
      </Text>
      <Text style={{ ...theme.typography.title, color: theme.colors.dangerInk }}>›</Text>
    </Pressable>
  );
}

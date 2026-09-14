import React, { useEffect, useRef } from 'react';
import { AccessibilityInfo, Pressable, Text, View } from 'react-native';
import { useTheme } from '../theme';

export type OfflineBannerState = 'offline' | 'reconnecting' | 'restored';

export interface OfflineBannerProps {
  state: OfflineBannerState;
  lastUpdatedLabel?: string;
  onRetryNow?: () => void;
}

const COPY: Record<OfflineBannerState, string> = {
  offline: 'Sin conexión · reintentando…',
  reconnecting: 'Sin conexión · reintentando…',
  restored: 'Conexión restablecida',
};

export function OfflineBanner({
  state,
  lastUpdatedLabel,
  onRetryNow,
}: OfflineBannerProps): React.JSX.Element {
  const theme = useTheme();
  const previousState = useRef<OfflineBannerState | null>(null);

  useEffect(() => {
    if (previousState.current !== state) {
      AccessibilityInfo.announceForAccessibility(COPY[state]);
      previousState.current = state;
    }
  }, [state]);

  const isRestored = state === 'restored';

  return (
    <View
      accessibilityLiveRegion="polite"
      style={{
        backgroundColor: isRestored ? theme.colors.success : theme.colors.surfaceAlt,
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <View style={{ flex: 1 }}>
        <Text
          style={{
            ...theme.typography.small,
            fontWeight: '600',
            color: isRestored ? theme.colors.onSuccess : theme.colors.text,
          }}
        >
          {COPY[state]}
        </Text>
        {!isRestored && lastUpdatedLabel && (
          <Text style={{ ...theme.typography.small, color: theme.colors.textMuted }}>
            Actualizado hace {lastUpdatedLabel}
          </Text>
        )}
      </View>
      {!isRestored && onRetryNow && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Reintentar ahora"
          hitSlop={8}
          onPress={onRetryNow}
        >
          <Text
            style={{
              ...theme.typography.small,
              fontWeight: '700',
              color: theme.colors.brandPressed,
            }}
          >
            Reintentar ahora
          </Text>
        </Pressable>
      )}
    </View>
  );
}

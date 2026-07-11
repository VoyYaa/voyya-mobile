// =============================================================================
// VoyYa — OfflineBanner (packages/ui-mobile)
// -----------------------------------------------------------------------------
// Banner superior de conectividad — mismo tono/cadencia en Pasajero y
// Conductor (ver ambas specs de UX, §6 / §2.4.4). Nunca `danger`: estar sin
// conexión es transitorio y esperable. Se anuncia SOLO en el cambio de estado.
// El llamador decide CUÁNDO montar este componente (p.ej. no renderizarlo si
// nunca hubo desconexión) — aquí solo vive la presentación de los 3 estados.
// =============================================================================

import React, { useEffect, useRef } from 'react';
import { AccessibilityInfo, Pressable, Text, View } from 'react-native';
import { useTheme } from '../theme';

export type OfflineBannerState = 'offline' | 'reconnecting' | 'restored';

export interface OfflineBannerProps {
  state: OfflineBannerState;
  /** Ya formateado por el llamador (ej. "12 s") — este componente no calcula tiempo relativo. */
  lastUpdatedLabel?: string;
  onRetryNow?: () => void;
}

const COPY: Record<OfflineBannerState, string> = {
  offline: 'Sin conexión · reintentando…',
  reconnecting: 'Sin conexión · reintentando…',
  restored: 'Conexión restablecida',
};

export function OfflineBanner({ state, lastUpdatedLabel, onRetryNow }: OfflineBannerProps): React.JSX.Element {
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
        <Pressable accessibilityRole="button" accessibilityLabel="Reintentar ahora" hitSlop={8} onPress={onRetryNow}>
          <Text style={{ ...theme.typography.small, fontWeight: '700', color: theme.colors.brandPressed }}>
            Reintentar ahora
          </Text>
        </Pressable>
      )}
    </View>
  );
}

import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useTheme } from '@voyyaa/ui-mobile';

export type ActionButtonLoading = 'accept' | 'reject' | null;

export interface ActionButtonPairProps {
  onAccept: () => void;
  onReject: () => void;
  loading?: ActionButtonLoading;
  disabled?: boolean;
}

export function ActionButtonPair({
  onAccept,
  onReject,
  loading = null,
  disabled = false,
}: ActionButtonPairProps): React.JSX.Element {
  const theme = useTheme();
  const isDisabled = disabled || loading !== null;

  return (
    <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Rechazar solicitud"
        accessibilityState={{ disabled: isDisabled, busy: loading === 'reject' }}
        disabled={isDisabled}
        onPress={onReject}
        style={({ pressed }) => ({
          flex: 1,
          minHeight: 48,
          borderRadius: theme.radius.button,
          backgroundColor: theme.colors.dangerTint,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          opacity: isDisabled && loading !== 'reject' ? 0.5 : pressed ? 0.85 : 1,
        })}
      >
        {loading === 'reject' && (
          <ActivityIndicator
            size="small"
            color={theme.colors.text}
            style={{ marginRight: theme.spacing.sm }}
          />
        )}
        <Text style={{ ...theme.typography.button, color: theme.colors.text }} numberOfLines={1}>
          {loading === 'reject' ? 'Rechazando…' : 'Rechazar'}
        </Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Aceptar solicitud"
        accessibilityState={{ disabled: isDisabled, busy: loading === 'accept' }}
        disabled={isDisabled}
        onPress={onAccept}
        style={({ pressed }) => ({
          flex: 1,
          minHeight: 48,
          borderRadius: theme.radius.button,
          backgroundColor: pressed && !isDisabled ? theme.colors.brandPressed : theme.colors.brand,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          opacity: isDisabled && loading !== 'accept' ? 0.5 : 1,
        })}
      >
        {loading === 'accept' && (
          <ActivityIndicator
            size="small"
            color={theme.colors.onBrand}
            style={{ marginRight: theme.spacing.sm }}
          />
        )}
        <Text style={{ ...theme.typography.button, color: theme.colors.onBrand }} numberOfLines={1}>
          {loading === 'accept' ? 'Aceptando…' : 'Aceptar'}
        </Text>
      </Pressable>
    </View>
  );
}

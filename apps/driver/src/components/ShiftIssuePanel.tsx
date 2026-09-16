import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '@voyyaa/ui-mobile';

export type ShiftIssueKind =
  | 'permission_denied'
  | 'gps_disabled'
  | 'no_vehicle'
  | 'offline'
  | 'server_error'
  | 'blocked_by_trip';

export interface ShiftIssuePanelProps {
  kind: ShiftIssueKind;
  onAction?: () => void;
}

const ISSUE_COPY: Record<ShiftIssueKind, { message: string; actionLabel?: string }> = {
  permission_denied: {
    message: 'Necesitamos tu ubicación para activar el turno.',
    actionLabel: 'Cómo habilitarlo',
  },
  gps_disabled: {
    message: 'Activa la ubicación de tu teléfono para poder recibir solicitudes.',
    actionLabel: 'Abrir ajustes',
  },
  no_vehicle: {
    message: 'No tienes un vehículo vinculado. Contacta al administrador.',
  },
  offline: {
    message: 'Sin conexión · no pudimos activar tu turno.',
    actionLabel: 'Reintentar',
  },
  server_error: {
    message: 'No pudimos activar tu turno.',
    actionLabel: 'Reintentar',
  },
  blocked_by_trip: {
    message: 'No puedes salir de turno con un viaje en curso. Finalízalo o cancélalo primero.',
  },
};

export function ShiftIssuePanel({ kind, onAction }: ShiftIssuePanelProps): React.JSX.Element {
  const theme = useTheme();
  const copy = ISSUE_COPY[kind];

  return (
    <View
      accessibilityRole="alert"
      style={{
        backgroundColor: theme.colors.dangerTint,
        borderRadius: theme.radius.card,
        padding: theme.spacing.lg,
        gap: theme.spacing.sm as number,
      }}
    >
      <Text style={{ ...theme.typography.body, color: theme.colors.dangerInk }}>
        {copy.message}
      </Text>
      {copy.actionLabel && onAction && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.actionLabel}
          onPress={onAction}
          hitSlop={8}
          style={{ minHeight: theme.touch.min, justifyContent: 'center' }}
        >
          <Text
            style={{ ...theme.typography.body, fontWeight: '700', color: theme.colors.dangerInk }}
          >
            {copy.actionLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

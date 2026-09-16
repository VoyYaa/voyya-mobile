import React from 'react';
import { Text, View } from 'react-native';
import { BottomSheet, Button, useTheme } from '@voyyaa/ui-mobile';

export interface CancelConfirmSheetProps {
  visible: boolean;
  withinWindow: boolean;
  loading: boolean;
  onConfirmCancel: () => void;
  onKeepWaiting: () => void;
}

export function CancelConfirmSheet({
  visible,
  withinWindow,
  loading,
  onConfirmCancel,
  onKeepWaiting,
}: CancelConfirmSheetProps): React.JSX.Element {
  const theme = useTheme();

  return (
    <BottomSheet visible={visible} onClose={onKeepWaiting} title="¿Cancelar viaje?">
      {withinWindow ? (
        <Text
          style={{
            ...theme.typography.body,
            color: theme.colors.text,
            marginBottom: theme.spacing.sm,
          }}
        >
          <Text style={{ color: theme.colors.successInk, fontWeight: '700' }}>Gratis</Text> · aún
          estás dentro de los 2 minutos.
        </Text>
      ) : (
        <Text
          style={{
            ...theme.typography.body,
            color: theme.colors.text,
            marginBottom: theme.spacing.sm,
          }}
        >
          Pasaron más de 2 minutos desde la asignación. Quedará{' '}
          <Text style={{ color: theme.colors.dangerInk, fontWeight: '700' }}>
            registrada como cancelación tardía
          </Text>
          .
        </Text>
      )}
      <View style={{ marginTop: theme.spacing.md, gap: theme.spacing.sm }}>
        <Button
          label="Sí, cancelar"
          variant="primary"
          loading={loading}
          loadingLabel="Cancelando…"
          onPress={onConfirmCancel}
        />
        <Button
          label="Seguir esperando"
          variant="ghost"
          disabled={loading}
          onPress={onKeepWaiting}
        />
      </View>
    </BottomSheet>
  );
}

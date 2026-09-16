import React from 'react';
import { Text, View } from 'react-native';
import { BottomSheet, Button, useTheme } from '@voyyaa/ui-mobile';

export interface NoShowConfirmSheetProps {
  visible: boolean;
  loading: boolean;
  errorMessage?: string;
  onConfirm: () => void;
  onKeepWaiting: () => void;
}

export function NoShowConfirmSheet({
  visible,
  loading,
  errorMessage,
  onConfirm,
  onKeepWaiting,
}: NoShowConfirmSheetProps): React.JSX.Element {
  const theme = useTheme();

  return (
    <BottomSheet visible={visible} onClose={onKeepWaiting} title="¿Confirmar que no se presentó?">
      <Text style={{ ...theme.typography.body, color: theme.colors.text }}>
        El viaje se cerrará y quedará registrado. No podrás deshacer esta acción.
      </Text>

      {errorMessage && (
        <Text
          accessibilityRole="alert"
          style={{
            ...theme.typography.small,
            color: theme.colors.dangerInk,
            marginTop: theme.spacing.sm,
          }}
        >
          {errorMessage}
        </Text>
      )}

      <View style={{ marginTop: theme.spacing.md, gap: theme.spacing.sm }}>
        <Button
          label="Sí, no se presentó"
          loading={loading}
          loadingLabel="Confirmando…"
          onPress={onConfirm}
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

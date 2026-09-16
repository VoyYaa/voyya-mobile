import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { BottomSheet, Button, TextField, useTheme } from '@voyyaa/ui-mobile';

export interface CancelTripSheetProps {
  visible: boolean;
  loading: boolean;
  errorMessage?: string;
  onConfirm: (reason: string) => void;
  onKeepGoing: () => void;
}

const MIN_REASON_LENGTH = 3;

export function CancelTripSheet({
  visible,
  loading,
  errorMessage,
  onConfirm,
  onKeepGoing,
}: CancelTripSheetProps): React.JSX.Element {
  const theme = useTheme();
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (visible) setReason('');
  }, [visible]);

  const isValid = reason.trim().length >= MIN_REASON_LENGTH;

  return (
    <BottomSheet visible={visible} onClose={onKeepGoing} title="Cancelar viaje">
      <TextField
        label="Motivo"
        value={reason}
        onChangeText={setReason}
        placeholder="¿Por qué cancelas?"
        disabled={loading}
      />
      <Text
        style={{
          ...theme.typography.small,
          color: theme.colors.textMuted,
          marginTop: theme.spacing.sm,
        }}
      >
        El viaje terminará y no se reintentará automáticamente. El pasajero podrá solicitar de
        nuevo.
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
          label="Cancelar viaje"
          loading={loading}
          loadingLabel="Cancelando…"
          disabled={!isValid}
          onPress={() => onConfirm(reason.trim())}
        />
        <Button label="Volver" variant="ghost" disabled={loading} onPress={onKeepGoing} />
      </View>
    </BottomSheet>
  );
}

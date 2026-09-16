import React, { useEffect, useState } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';
import { BottomSheet, Button, PriceTag, useTheme } from '@voyyaa/ui-mobile';

export interface FinishTripSheetProps {
  visible: boolean;
  price: number;
  loading: boolean;
  errorMessage?: string;
  onConfirm: (cashCollected: boolean) => void;
  onKeepGoing: () => void;
}

export function FinishTripSheet({
  visible,
  price,
  loading,
  errorMessage,
  onConfirm,
  onKeepGoing,
}: FinishTripSheetProps): React.JSX.Element {
  const theme = useTheme();
  const [cashCollected, setCashCollected] = useState(true);

  useEffect(() => {
    if (visible) setCashCollected(true);
  }, [visible]);

  return (
    <BottomSheet visible={visible} onClose={onKeepGoing} title="Finalizar viaje">
      <PriceTag amountCOP={price} size="lg" />

      <Pressable
        onPress={() => setCashCollected((v) => !v)}
        accessibilityRole="switch"
        accessibilityState={{ checked: cashCollected }}
        accessibilityLabel="Cobré en efectivo"
        accessibilityHint="Si lo desmarcas, el cobro quedará pendiente de confirmar más tarde"
        disabled={loading}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: theme.touch.min,
          marginTop: theme.spacing.md,
        }}
      >
        <Text style={{ ...theme.typography.body, color: theme.colors.text }}>
          Cobré en efectivo
        </Text>
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          pointerEvents="none"
        >
          <Switch
            value={cashCollected}
            trackColor={{ false: theme.colors.border, true: theme.colors.brand }}
            thumbColor={theme.colors.surface}
          />
        </View>
      </Pressable>

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
          label="Finalizar"
          loading={loading}
          loadingLabel="Finalizando…"
          onPress={() => onConfirm(cashCollected)}
        />
        <Button label="Seguir viaje" variant="ghost" disabled={loading} onPress={onKeepGoing} />
      </View>
    </BottomSheet>
  );
}

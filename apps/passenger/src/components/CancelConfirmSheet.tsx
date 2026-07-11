// =============================================================================
// VoyYa Pasajero — CancelConfirmSheet
// -----------------------------------------------------------------------------
// Hoja de confirmación de cancelación DESPUÉS de asignado (§7.2/§7.3). Cerrar
// por backdrop/gesto de back equivale SIEMPRE a "Seguir esperando" (§7.5) — el
// `onClose` de <BottomSheet> se mapea aquí a esa opción segura, nunca a cancelar.
// =============================================================================

import React from 'react';
import { Text, View } from 'react-native';
import { BottomSheet, Button, useTheme } from '@voyya/ui-mobile';

export interface CancelConfirmSheetProps {
  visible: boolean;
  dentroDeVentana: boolean;
  loading: boolean;
  onConfirmarCancelar: () => void;
  onSeguirEsperando: () => void;
}

export function CancelConfirmSheet({
  visible,
  dentroDeVentana,
  loading,
  onConfirmarCancelar,
  onSeguirEsperando,
}: CancelConfirmSheetProps): React.JSX.Element {
  const theme = useTheme();

  return (
    <BottomSheet visible={visible} onClose={onSeguirEsperando} title="¿Cancelar viaje?">
      {dentroDeVentana ? (
        <Text style={{ ...theme.typography.body, color: theme.colors.text, marginBottom: theme.spacing.sm }}>
          <Text style={{ color: theme.colors.success, fontWeight: '700' }}>Gratis</Text> · aún estás dentro de los 2
          minutos.
        </Text>
      ) : (
        <Text style={{ ...theme.typography.body, color: theme.colors.text, marginBottom: theme.spacing.sm }}>
          Pasaron más de 2 minutos desde la asignación. Quedará{' '}
          <Text style={{ color: theme.colors.danger, fontWeight: '700' }}>registrada como cancelación tardía</Text>.
        </Text>
      )}
      <View style={{ marginTop: theme.spacing.md, gap: theme.spacing.sm }}>
        <Button
          label="Sí, cancelar"
          variant="primary"
          loading={loading}
          loadingLabel="Cancelando…"
          onPress={onConfirmarCancelar}
        />
        <Button label="Seguir esperando" variant="ghost" disabled={loading} onPress={onSeguirEsperando} />
      </View>
    </BottomSheet>
  );
}

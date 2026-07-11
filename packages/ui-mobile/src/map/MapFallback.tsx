// =============================================================================
// VoyYa — MapFallback (packages/ui-mobile)
// -----------------------------------------------------------------------------
// Se muestra en vez del mapa real cuando falta `EXPO_PUBLIC_MAPBOX_TOKEN`, la
// app corre en Expo Go (el módulo nativo de @rnmapbox/maps no existe ahí), o
// el árbol nativo lanzó un error inesperado (ver MapErrorBoundary). Mismo
// lenguaje visual que el placeholder original de Home/solicitud (mismos
// tokens) — la app NUNCA debe verse rota por no tener el mapa real disponible.
// =============================================================================

import React from 'react';
import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../theme';

export interface MapFallbackProps {
  label?: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function MapFallback({ label, height = 200, style, testID }: MapFallbackProps): React.JSX.Element {
  const theme = useTheme();

  return (
    <View
      testID={testID}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        {
          height,
          borderRadius: theme.radius.card,
          backgroundColor: theme.colors.surfaceAlt,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: theme.colors.border,
        },
        style,
      ]}
    >
      <Text style={{ ...theme.typography.small, color: theme.colors.textMuted }}>
        {label ?? 'Mapa no disponible'}
      </Text>
    </View>
  );
}

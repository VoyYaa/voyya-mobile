// =============================================================================
// VoyYa — BottomSheet (packages/ui-mobile)
// -----------------------------------------------------------------------------
// Primitivo de hoja modal (sobre <Modal> de RN — foco/anuncio nativos del SO).
// `onClose` es SOLO el disparador de cierre (backdrop, gesto/botón de back);
// quien lo use decide qué significa cerrar. Para hojas de confirmación de
// acciones irreversibles (p.ej. cancelar viaje), el LLAMADOR debe mapear
// `onClose` a la opción segura, nunca a la destructiva
// (pasajero-estados-borde.md §7.5) — este componente lo hace posible, no lo impone.
// =============================================================================

import React, { useEffect, useRef } from 'react';
import { AccessibilityInfo, Modal, Pressable, Text, View } from 'react-native';
import { useTheme } from '../theme';

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  testID?: string;
}

export function BottomSheet({ visible, onClose, title, children, testID }: BottomSheetProps): React.JSX.Element {
  const theme = useTheme();
  const announcedTitle = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (visible && title && announcedTitle.current !== title) {
      AccessibilityInfo.announceForAccessibility(title);
      announcedTitle.current = title;
    }
    if (!visible) {
      announcedTitle.current = undefined;
    }
  }, [visible, title]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} testID={testID}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable
          accessibilityLabel="Cerrar"
          accessibilityRole="button"
          onPress={onClose}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' }}
        />
        <View
          accessibilityViewIsModal
          style={{
            backgroundColor: theme.colors.surface,
            borderTopLeftRadius: theme.radius.sheet,
            borderTopRightRadius: theme.radius.sheet,
            padding: theme.spacing.xl,
            paddingBottom: theme.spacing.xxl,
            ...theme.shadow.lg,
          }}
        >
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={{
              alignSelf: 'center',
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: theme.colors.border,
              marginBottom: theme.spacing.md,
            }}
          />
          {title && (
            <Text
              accessibilityRole="header"
              style={{ ...theme.typography.title, color: theme.colors.text, marginBottom: theme.spacing.sm }}
            >
              {title}
            </Text>
          )}
          {children}
        </View>
      </View>
    </Modal>
  );
}

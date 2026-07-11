// =============================================================================
// VoyYa Conductor — RequestListSkeleton
// -----------------------------------------------------------------------------
// Shimmer de 3 `RequestRow` fantasma (círculo de avatar + 2 líneas + bloque de
// precio) — §2.4.1. Todo el bloque queda oculto para lectores de pantalla: el
// ÚNICO anuncio de accesibilidad ("Cargando solicitudes cercanas") lo dispara la
// pantalla una sola vez al entrar, no este componente por cada fotograma.
// =============================================================================

import React from 'react';
import { View } from 'react-native';
import { Card, Skeleton, useTheme } from '@voyya/ui-mobile';

function GhostRow(): React.JSX.Element {
  const theme = useTheme();
  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
        <Skeleton width={44} height={44} radius={22} />
        <View style={{ flex: 1, gap: theme.spacing.xs as number }}>
          <Skeleton width="60%" height={16} />
          <Skeleton width="85%" height={13} />
        </View>
        <Skeleton width={56} height={20} />
      </View>
    </Card>
  );
}

export interface RequestListSkeletonProps {
  /** Filas fantasma a mostrar (3–4 en la lista completa; 1 en el resumen de Home). */
  count?: number;
}

export function RequestListSkeleton({ count = 3 }: RequestListSkeletonProps): React.JSX.Element {
  const theme = useTheme();
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ gap: theme.spacing.sm as number }}
    >
      {Array.from({ length: count }, (_, i) => (
        <GhostRow key={i} />
      ))}
    </View>
  );
}

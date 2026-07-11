// =============================================================================
// VoyYa — MapErrorBoundary (packages/ui-mobile)
// -----------------------------------------------------------------------------
// Red de seguridad para @rnmapbox/maps: `mapbox-env.ts` cubre los dos casos
// PREVISTOS (sin token, Expo Go) antes incluso de montar el árbol nativo. Este
// boundary cubre lo IMPREVISTO — cualquier otro fallo nativo (p.ej. un
// dev-client construido antes de vincular el plugin) — para que la app entera
// no truene con una pantalla roja; cae al mismo MapFallback. Ver
// docs/specs/decision-geocodificacion-yarumal.md.
// =============================================================================

import React from 'react';

export interface MapErrorBoundaryProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
}

interface MapErrorBoundaryState {
  hasError: boolean;
}

export class MapErrorBoundary extends React.Component<MapErrorBoundaryProps, MapErrorBoundaryState> {
  override state: MapErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): MapErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: Error): void {
    console.warn('[@voyya/ui-mobile] Map: fallback por error nativo al renderizar el mapa.', error);
  }

  override render(): React.ReactNode {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

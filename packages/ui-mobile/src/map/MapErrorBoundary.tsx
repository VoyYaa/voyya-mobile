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
    console.warn('[@voyyaa/ui-mobile] Map: falling back after a native rendering error.', error);
  }

  override render(): React.ReactNode {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

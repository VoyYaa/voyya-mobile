import React from 'react';
import { StatePanel, type StatePanelAction } from './StatePanel';

export interface EmptyStateProps {
  icon?: string;
  title: string;
  body?: string;
  primaryAction?: StatePanelAction;
  secondaryAction?: StatePanelAction;
}

export function EmptyState(props: EmptyStateProps): React.JSX.Element {
  return <StatePanel {...props} accessibilityRole="none" />;
}

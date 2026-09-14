import React from 'react';
import { StatePanel } from './StatePanel';

export interface ErrorStateProps {
  title: string;
  body?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorState({
  title,
  body,
  onRetry,
  retryLabel = 'Reintentar',
}: ErrorStateProps): React.JSX.Element {
  return (
    <StatePanel
      icon="⚠️"
      title={title}
      body={body}
      accessibilityRole="alert"
      primaryAction={
        onRetry ? { label: retryLabel, onPress: onRetry, variant: 'primary' } : undefined
      }
    />
  );
}

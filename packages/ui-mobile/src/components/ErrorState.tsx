import React from 'react';
import { uiCopy } from '../copy';
import { StatePanel, type StatePanelTone } from './StatePanel';

export interface ErrorStateProps {
  title: string;
  body?: string;
  onRetry?: () => void;
  retryLabel?: string;
  tone?: StatePanelTone;
  testID?: string;
}

export function ErrorState({
  title,
  body,
  onRetry,
  retryLabel = uiCopy.retry,
  tone,
  testID,
}: ErrorStateProps): React.JSX.Element {
  return (
    <StatePanel
      glyph="error"
      title={title}
      body={body}
      tone={tone}
      testID={testID}
      accessibilityRole="alert"
      primaryAction={
        onRetry ? { label: retryLabel, onPress: onRetry, variant: 'primary' } : undefined
      }
    />
  );
}

export interface OfflineStateProps {
  title?: string;
  body?: string;
  onRetry?: () => void;
  retryLabel?: string;
  tone?: StatePanelTone;
  testID?: string;
}

export function OfflineState({
  title = uiCopy.offlineTitle,
  body = uiCopy.offlineBody,
  onRetry,
  retryLabel = uiCopy.retry,
  tone,
  testID,
}: OfflineStateProps): React.JSX.Element {
  return (
    <StatePanel
      glyph="offline"
      title={title}
      body={body}
      tone={tone}
      testID={testID}
      accessibilityRole="alert"
      primaryAction={
        onRetry ? { label: retryLabel, onPress: onRetry, variant: 'primary' } : undefined
      }
    />
  );
}

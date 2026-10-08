import React from 'react';
import { StatePanel, type StatePanelAction, type StatePanelTone } from './StatePanel';
import type { MarkGlyphName } from './brand/MarkGlyph';

export interface EmptyStateProps {
  glyph?: MarkGlyphName;
  icon?: string;
  title: string;
  body?: string;
  primaryAction?: StatePanelAction;
  secondaryAction?: StatePanelAction;
  tone?: StatePanelTone;
  testID?: string;
}

export function EmptyState({ glyph, icon, ...rest }: EmptyStateProps): React.JSX.Element {
  const resolvedGlyph = glyph ?? (icon ? undefined : 'empty');
  return <StatePanel {...rest} glyph={resolvedGlyph} icon={icon} accessibilityRole="none" />;
}

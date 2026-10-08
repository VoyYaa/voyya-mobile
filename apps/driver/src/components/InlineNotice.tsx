import React from 'react';
import { Text, View } from 'react-native';
import { Button, MarkGlyph, useTheme } from '@voyyaa/ui-mobile';

export type InlineNoticeTone = 'info' | 'danger';

export interface InlineNoticeProps {
  tone: InlineNoticeTone;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
  testID?: string;
}

const GLYPH_SIZE = 24;

export function InlineNotice({
  tone,
  message,
  actionLabel,
  onAction,
  actionDisabled = false,
  testID,
}: InlineNoticeProps): React.JSX.Element {
  const theme = useTheme();
  const ink = tone === 'danger' ? theme.colors.dangerInk : theme.colors.infoInk;

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      testID={testID}
      style={{ gap: theme.spacing.sm }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
        <MarkGlyph
          glyph={tone === 'danger' ? 'error' : 'offline'}
          size={GLYPH_SIZE}
          animate={false}
        />
        <Text style={{ ...theme.typography.small, color: ink, flex: 1 }}>{message}</Text>
      </View>
      {actionLabel && onAction && (
        <Button
          label={actionLabel}
          variant="secondary"
          onPress={onAction}
          disabled={actionDisabled}
          testID={testID ? `${testID}-action` : undefined}
        />
      )}
    </View>
  );
}

import React from 'react';
import { Text, View } from 'react-native';
import { MarkGlyph, useTheme, type ColorTokens } from '@voyyaa/ui-mobile';
import type { MessageTone, MessageView } from '../lib/otp-presentation';

export interface AuthMessageProps {
  message: MessageView;
  alert?: boolean;
  testID?: string;
}

const GLYPH_SIZE = 20;

const TONE_INK: Record<MessageTone, keyof ColorTokens> = {
  danger: 'dangerInk',
  info: 'infoInk',
  muted: 'textMuted',
  success: 'successInk',
};

export function AuthMessage({
  message,
  alert = false,
  testID,
}: AuthMessageProps): React.JSX.Element {
  const theme = useTheme();

  return (
    <View
      testID={testID}
      accessibilityRole={alert ? 'alert' : undefined}
      style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}
    >
      {message.glyph !== null && (
        <MarkGlyph glyph={message.glyph} size={GLYPH_SIZE} animate={false} />
      )}
      <Text
        style={{
          ...theme.typography.smallStrong,
          color: theme.colors[TONE_INK[message.tone]],
          flexShrink: 1,
        }}
      >
        {message.text}
      </Text>
    </View>
  );
}

import React from 'react';
import { Text, View } from 'react-native';
import { Card, MarkGlyph, useTheme } from '@voyyaa/ui-mobile';

const NOTICE_GLYPH_SIZE = 40;

export interface AuthNoticeCardProps {
  glyph: 'clock' | 'error';
  title: string;
  body: string;
  children?: React.ReactNode;
  testID?: string;
}

export function AuthNoticeCard({
  glyph,
  title,
  body,
  children,
  testID = 'login-notice',
}: AuthNoticeCardProps): React.JSX.Element {
  const theme = useTheme();
  return (
    <Card tone="tint" testID={testID}>
      <View accessibilityRole="alert" style={{ gap: theme.spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
          <MarkGlyph glyph={glyph} size={NOTICE_GLYPH_SIZE} />
          <Text style={{ ...theme.typography.subtitle, color: theme.colors.text, flex: 1 }}>
            {title}
          </Text>
        </View>
        <Text style={{ ...theme.typography.body, color: theme.colors.textMuted }}>{body}</Text>
        {children}
      </View>
    </Card>
  );
}

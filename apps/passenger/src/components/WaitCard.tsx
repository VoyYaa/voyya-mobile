import React, { useEffect } from 'react';
import { AccessibilityInfo, Text, View } from 'react-native';
import { Card, MarkGlyph, formatMMSS, useTheme } from '@voyyaa/ui-mobile';
import { waitCardText } from '../lib/wait-format';

export interface WaitCardProps {
  title: string;
  remainingSec: number;
  timeKnown: boolean;
  testID?: string;
}

const GLYPH_SIZE = 32;

export function WaitCard({
  title,
  remainingSec,
  timeKnown,
  testID = 'rate-limit-card',
}: WaitCardProps): React.JSX.Element {
  const theme = useTheme();
  const text = waitCardText(timeKnown ? remainingSec : null, formatMMSS);
  const label = `${title}. ${text.spokenBody}`;

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(label);
  }, []);

  return (
    <Card tone="tint" testID={testID}>
      <View
        accessible
        accessibilityLabel={label}
        style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}
      >
        <MarkGlyph glyph="clock" size={GLYPH_SIZE} />
        <View style={{ flex: 1, gap: theme.spacing.xxs }}>
          <Text style={{ ...theme.typography.bodyStrong, color: theme.colors.text }}>{title}</Text>
          <Text style={{ ...theme.typography.small, color: theme.colors.text }}>{text.body}</Text>
        </View>
      </View>
    </Card>
  );
}

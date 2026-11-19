import React from 'react';
import { Text } from 'react-native';
import { useTheme } from '@voyyaa/ui-mobile';
import { useDemoSession } from './useDemoSession';

export interface DemoNoteProps {
  text: string;
  tone?: 'light' | 'stage';
  align?: 'left' | 'center';
  testID?: string;
}

export function DemoNote({
  text,
  tone = 'light',
  align = 'left',
  testID,
}: DemoNoteProps): React.JSX.Element | null {
  const theme = useTheme();
  const demo = useDemoSession();
  if (demo === null) return null;

  return (
    <Text
      testID={testID}
      style={{
        ...theme.typography.small,
        textAlign: align,
        color: tone === 'stage' ? theme.colors.onStageMuted : theme.colors.textMuted,
      }}
    >
      {text}
    </Text>
  );
}

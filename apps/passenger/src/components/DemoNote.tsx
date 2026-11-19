import React from 'react';
import { Text } from 'react-native';
import { useTheme } from '@voyyaa/ui-mobile';
import { useDemoSession } from '@voyyaa/app-runtime';

export interface DemoNoteProps {
  text: string;
  tone?: 'light' | 'stage';
  testID?: string;
}

export function DemoNote({
  text,
  tone = 'light',
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
        color: tone === 'stage' ? theme.colors.onStageMuted : theme.colors.textMuted,
      }}
    >
      {text}
    </Text>
  );
}

import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../theme';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';

export interface DemoInfoSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  body: string;
  bullets: readonly string[];
  okLabel: string;
  testID?: string;
}

const BULLET_SIZE = 6;

export function DemoInfoSheet({
  visible,
  onClose,
  title,
  body,
  bullets,
  okLabel,
  testID = 'demo-info-sheet',
}: DemoInfoSheetProps): React.JSX.Element {
  const theme = useTheme();

  return (
    <BottomSheet visible={visible} onClose={onClose} title={title} testID={testID}>
      <Text style={{ ...theme.typography.body, color: theme.colors.text }}>{body}</Text>
      <View accessibilityRole="list" style={{ marginTop: theme.spacing.md, gap: theme.spacing.sm }}>
        {bullets.map((bullet) => (
          <View
            key={bullet}
            style={{ flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.md }}
          >
            <View
              style={{
                width: BULLET_SIZE,
                height: BULLET_SIZE,
                borderRadius: BULLET_SIZE / 2,
                backgroundColor: theme.colors.brand,
                marginTop: theme.spacing.sm,
              }}
            />
            <Text style={{ ...theme.typography.body, color: theme.colors.textMuted, flex: 1 }}>
              {bullet}
            </Text>
          </View>
        ))}
      </View>
      <View style={{ marginTop: theme.spacing.lg }}>
        <Button label={okLabel} size="lg" onPress={onClose} testID={`${testID}-ok`} />
      </View>
    </BottomSheet>
  );
}

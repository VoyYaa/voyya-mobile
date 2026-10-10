import React from 'react';
import { Platform, Text, View } from 'react-native';
import { BottomSheet, Button, LinkButton, useTheme } from '@voyyaa/ui-mobile';
import { driverCopy } from '../copy/driver-copy';

export interface SharingDisclosureSheetProps {
  visible: boolean;
  onDismiss: () => void;
  onReadFullNotice: () => void;
}

const copy = driverCopy.disclosure;
const BULLET_SIZE = 6;

export function SharingDisclosureSheet({
  visible,
  onDismiss,
  onReadFullNotice,
}: SharingDisclosureSheetProps): React.JSX.Element {
  const theme = useTheme();

  return (
    <BottomSheet
      visible={visible}
      onClose={onDismiss}
      title={copy.title}
      testID="sharing-disclosure-sheet"
    >
      <Text style={{ ...theme.typography.body, color: theme.colors.text }}>{copy.intro}</Text>
      <View accessibilityRole="list" style={{ marginTop: theme.spacing.md, gap: theme.spacing.sm }}>
        {copy.bullets.map((bullet) => (
          <View key={bullet} style={{ flexDirection: 'row', gap: theme.spacing.md }}>
            <View
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={{
                width: BULLET_SIZE,
                height: BULLET_SIZE,
                borderRadius: BULLET_SIZE / 2,
                backgroundColor: theme.colors.brand,
                marginTop: theme.spacing.sm,
              }}
            />
            <Text style={{ ...theme.typography.body, color: theme.colors.text, flex: 1 }}>
              {bullet}
            </Text>
          </View>
        ))}
      </View>
      {Platform.OS === 'ios' && (
        <Text
          style={{
            ...theme.typography.small,
            color: theme.colors.textMuted,
            marginTop: theme.spacing.md,
          }}
        >
          {copy.iosNote}
        </Text>
      )}
      <View style={{ marginTop: theme.spacing.md, alignItems: 'flex-start' }}>
        <LinkButton label={copy.fullNotice} onPress={onReadFullNotice} testID="disclosure-full" />
      </View>
      <View style={{ marginTop: theme.spacing.md }}>
        <Button label={copy.ok} size="lg" onPress={onDismiss} testID="disclosure-ok" />
      </View>
    </BottomSheet>
  );
}

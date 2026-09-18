import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../theme';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';

export interface LocationConsentRow {
  label: string;
  value: string;
}

export interface LocationConsentSheetProps {
  visible: boolean;
  title: string;
  rows: readonly LocationConsentRow[];
  primaryLabel: string;
  secondaryLabel?: string;
  onPrimary: () => void;
  onSecondary?: () => void;
  testID?: string;
}

export function LocationConsentSheet({
  visible,
  title,
  rows,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
  testID,
}: LocationConsentSheetProps): React.JSX.Element {
  const theme = useTheme();
  const onClose = onSecondary ?? onPrimary;

  return (
    <BottomSheet visible={visible} onClose={onClose} title={title} testID={testID}>
      <View style={{ gap: theme.spacing.md }}>
        {rows.map((row) => (
          <View key={row.label}>
            <Text
              style={{ ...theme.typography.small, fontWeight: '700', color: theme.colors.text }}
            >
              {row.label}
            </Text>
            <Text style={{ ...theme.typography.body, color: theme.colors.textMuted, marginTop: 2 }}>
              {row.value}
            </Text>
          </View>
        ))}
      </View>
      <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.sm }}>
        <Button label={primaryLabel} onPress={onPrimary} />
        {secondaryLabel && onSecondary && (
          <Button label={secondaryLabel} variant="ghost" onPress={onSecondary} />
        )}
      </View>
    </BottomSheet>
  );
}

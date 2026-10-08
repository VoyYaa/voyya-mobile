import React from 'react';
import { Text, View } from 'react-native';
import { MarkGlyph, useTheme } from '@voyyaa/ui-mobile';
import { driverCopy } from '../copy/driver-copy';

export interface PinRuleRowProps {
  label: string;
  met: boolean;
  testID?: string;
}

const MARK_SIZE = 16;
const DOT_SIZE = 8;

export function PinRuleRow({ label, met, testID }: PinRuleRowProps): React.JSX.Element {
  const theme = useTheme();
  const status = met ? driverCopy.createPin.ruleMet : driverCopy.createPin.ruleNotMet;

  return (
    <View
      accessible
      accessibilityLabel={`${label}. ${status}`}
      testID={testID}
      style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}
    >
      <View
        style={{
          width: MARK_SIZE,
          height: MARK_SIZE,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {met ? (
          <MarkGlyph glyph="success" size={MARK_SIZE} animate={false} />
        ) : (
          <View
            style={{
              width: DOT_SIZE,
              height: DOT_SIZE,
              borderRadius: DOT_SIZE / 2,
              backgroundColor: theme.colors.textSubtle,
            }}
          />
        )}
      </View>
      <Text
        style={{
          ...theme.typography.small,
          color: met ? theme.colors.successInk : theme.colors.textMuted,
          flex: 1,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

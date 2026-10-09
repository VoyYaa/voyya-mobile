import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { MarkGlyph, useTheme } from '@voyyaa/ui-mobile';
import { passengerCopy } from '../copy/passenger-copy';

export interface CompanyOptionProps {
  name: string;
  detail: string | null;
  lacksDrivers?: boolean;
  selected: boolean;
  onPress: () => void;
  testID?: string;
}

const copy = passengerCopy.company;
const OPTION_MIN_HEIGHT = 64;
const RING_SIZE = 24;
const DOT_SIZE = 12;
const CLOCK_SIZE = 16;

export function CompanyOption({
  name,
  detail,
  lacksDrivers = false,
  selected,
  onPress,
  testID,
}: CompanyOptionProps): React.JSX.Element {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const spokenDetail = lacksDrivers ? copy.noDrivers : detail;

  return (
    <Pressable
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={copy.optionAccessibility(name, spokenDetail)}
      testID={testID}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        minHeight: OPTION_MIN_HEIGHT,
        padding: theme.spacing.md,
        borderBottomWidth: focused ? 2 : 1,
        borderBottomColor: theme.colors.border,
        borderWidth: focused ? 2 : 0,
        borderColor: focused ? theme.colors.focusRing : 'transparent',
        backgroundColor: selected ? theme.colors.brandTint : 'transparent',
      }}
    >
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{
          width: RING_SIZE,
          height: RING_SIZE,
          borderRadius: RING_SIZE / 2,
          borderWidth: 1.5,
          borderColor: selected ? theme.colors.text : theme.colors.borderStrong,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {selected && (
          <View
            style={{
              width: DOT_SIZE,
              height: DOT_SIZE,
              borderRadius: DOT_SIZE / 2,
              backgroundColor: theme.colors.text,
            }}
          />
        )}
      </View>
      <View style={{ flex: 1, gap: theme.spacing.xxs }}>
        <Text style={{ ...theme.typography.subtitle, color: theme.colors.text }}>{name}</Text>
        {lacksDrivers ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
            <MarkGlyph glyph="clock" size={CLOCK_SIZE} animate={false} />
            <Text style={{ ...theme.typography.small, color: theme.colors.textMuted }}>
              {copy.noDrivers}
            </Text>
          </View>
        ) : detail ? (
          <Text style={{ ...theme.typography.small, color: theme.colors.textMuted }}>{detail}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

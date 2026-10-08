import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { LinkButton, MarkGlyph, useTheme } from '@voyyaa/ui-mobile';
import { passengerCopy } from '../copy/passenger-copy';

export type CompanyRowValue =
  { kind: 'any' } | { kind: 'company'; name: string; lacksDrivers: boolean } | { kind: 'unset' };

export interface CompanyPickerRowProps {
  value: CompanyRowValue;
  disabled?: boolean;
  rowRef?: React.RefObject<View>;
  onOpen: () => void;
  onUseAny: () => void;
}

const copy = passengerCopy.company;
const ROW_MIN_HEIGHT = 72;
const GLYPH_SIZE = 16;

function accessibilityLabelOf(value: CompanyRowValue): string {
  if (value.kind === 'unset') return copy.unsetAccessibility;
  if (value.kind === 'any') return copy.rowAccessibility(copy.any, copy.anyDetail);
  return copy.rowAccessibility(value.name, value.lacksDrivers ? copy.noDrivers : undefined);
}

function valueLabelOf(value: CompanyRowValue): string {
  if (value.kind === 'any') return copy.any;
  if (value.kind === 'company') return value.name;
  return copy.unset;
}

export function CompanyPickerRow({
  value,
  disabled = false,
  rowRef,
  onOpen,
  onUseAny,
}: CompanyPickerRowProps): React.JSX.Element {
  const theme = useTheme();
  const unset = value.kind === 'unset';
  const lacksDrivers = value.kind === 'company' && value.lacksDrivers;

  return (
    <View style={{ gap: theme.spacing.xs }}>
      <Pressable
        ref={rowRef}
        onPress={onOpen}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabelOf(value)}
        accessibilityHint={copy.rowHint}
        accessibilityState={{ disabled }}
        testID="company-picker-row"
        style={({ pressed }) => ({
          minHeight: ROW_MIN_HEIGHT,
          justifyContent: 'center',
          gap: theme.spacing.xxs,
          padding: theme.spacing.lg,
          borderRadius: theme.radius.card,
          borderWidth: unset ? 2 : 1,
          borderColor: unset ? theme.colors.danger : theme.colors.border,
          backgroundColor: theme.colors.surfaceSunken,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        })}
      >
        <Text style={{ ...theme.typography.eyebrow, color: theme.colors.textMuted }}>
          {copy.rowEyebrow}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
          {unset && <MarkGlyph glyph="error" size={GLYPH_SIZE} animate={false} />}
          <Text
            style={{
              ...theme.typography.subtitle,
              color: unset ? theme.colors.dangerInk : theme.colors.text,
              flex: 1,
            }}
          >
            {valueLabelOf(value)}
          </Text>
          <Text style={{ ...theme.typography.smallStrong, color: theme.colors.brandInk }}>
            {copy.change}
          </Text>
        </View>
        {value.kind === 'any' && (
          <Text style={{ ...theme.typography.small, color: theme.colors.textMuted }}>
            {copy.anyDetail}
          </Text>
        )}
        {lacksDrivers && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
            <MarkGlyph glyph="clock" size={GLYPH_SIZE} animate={false} />
            <Text style={{ ...theme.typography.small, color: theme.colors.textMuted }}>
              {copy.noDrivers}
            </Text>
          </View>
        )}
      </Pressable>
      {lacksDrivers && (
        <LinkButton label={copy.useAnyLink} onPress={onUseAny} testID="company-use-any" />
      )}
    </View>
  );
}

import React from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import {
  BrandSpinner,
  Button,
  Card,
  LinkButton,
  MarkGlyph,
  RadarPulse,
  useTheme,
} from '@voyyaa/ui-mobile';
import { driverCopy } from '../copy/driver-copy';

export interface ShiftSwitchProps {
  checked: boolean;
  busy: boolean;
  disabled?: boolean;
  onToggle: () => void;
}

const SWITCH_HEIGHT = 72;
const PULSE_SIZE = 36;
const STACK_FONT_SCALE = 1.3;
const PULSE_PERIOD_MS = 3200;

export function ShiftSwitch({
  checked,
  busy,
  disabled = false,
  onToggle,
}: ShiftSwitchProps): React.JSX.Element {
  const theme = useTheme();
  const { colors } = theme;
  const stacked = useWindowDimensions().fontScale > STACK_FONT_SCALE;

  if (disabled) {
    return (
      <Card tone="tint" testID="shift-switch-disabled">
        <View
          accessibilityRole="alert"
          style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}
        >
          <MarkGlyph glyph="error" size={40} />
          <Text style={{ ...theme.typography.body, color: colors.text, flex: 1 }}>
            {driverCopy.home.noVehicle}
          </Text>
        </View>
      </Card>
    );
  }

  if (!checked) {
    return (
      <Button
        label={driverCopy.home.activateShift}
        loadingLabel={driverCopy.home.shiftBusyOn}
        size="lg"
        loading={busy}
        onPress={onToggle}
        style={{ minHeight: SWITCH_HEIGHT }}
        testID="shift-switch"
      />
    );
  }

  return (
    <View
      testID="shift-switch"
      style={{
        minHeight: SWITCH_HEIGHT,
        flexDirection: stacked ? 'column' : 'row',
        alignItems: stacked ? 'stretch' : 'center',
        gap: theme.spacing.sm,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.radius.card,
        borderWidth: 2,
        borderColor: colors.success,
        backgroundColor: colors.successTint,
      }}
    >
      <View
        style={{
          flex: stacked ? undefined : 1,
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing.md,
        }}
      >
        <View style={{ width: PULSE_SIZE, alignItems: 'center' }}>
          {busy ? (
            <BrandSpinner size={24} tone="onLight" />
          ) : (
            <RadarPulse
              size={PULSE_SIZE}
              rings={1}
              periodMs={PULSE_PERIOD_MS}
              color={colors.success}
            />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ ...theme.typography.subtitle, color: colors.successInk }}>
            {driverCopy.home.onShiftEyebrow}
          </Text>
          <Text style={{ ...theme.typography.small, color: colors.text }}>
            {busy ? driverCopy.home.shiftBusyOff : driverCopy.home.shiftOnHint}
          </Text>
        </View>
      </View>
      <LinkButton
        label={driverCopy.home.endShift}
        disabled={busy}
        onPress={onToggle}
        style={{ alignSelf: stacked ? 'flex-end' : 'center' }}
        testID="shift-switch-end"
      />
    </View>
  );
}

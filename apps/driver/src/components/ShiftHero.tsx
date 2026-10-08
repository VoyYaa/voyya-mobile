import React from 'react';
import { Text, View } from 'react-native';
import { AccountAvatar, BrandMark, RadarPulse, Stage, useTheme } from '@voyyaa/ui-mobile';
import { driverCopy } from '../copy/driver-copy';

export interface ShiftHeroProps {
  onShift: boolean;
  topInset: number;
  driverName?: string;
  onAvatarPress: () => void;
}

const HERO_MIN_HEIGHT = 168;
const PULSE_SIZE = 168;
const PULSE_PERIOD_MS = 3200;
const PULSE_FILL_OPACITY = 0.1;
const PULSE_STROKE_OPACITY = 0.35;
const BRAND_MARK_SIZE = 32;
const STATUS_DOT_SIZE = 8;

export function ShiftHero({
  onShift,
  topInset,
  driverName,
  onAvatarPress,
}: ShiftHeroProps): React.JSX.Element {
  const theme = useTheme();
  const { colors } = theme;

  const header = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: theme.touch.min,
      }}
    >
      <BrandMark
        role="driver"
        size={BRAND_MARK_SIZE}
        wordmark
        tone={onShift ? 'onDark' : 'onLight'}
      />
      <AccountAvatar
        name={driverName}
        accessibilityLabel={driverCopy.home.accountOpen}
        onPress={onAvatarPress}
        testID="account-avatar"
      />
    </View>
  );

  const body = (
    <View style={{ gap: theme.spacing.xs, paddingTop: theme.spacing.lg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
        {onShift && (
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={{
              width: STATUS_DOT_SIZE,
              height: STATUS_DOT_SIZE,
              borderRadius: STATUS_DOT_SIZE / 2,
              backgroundColor: colors.success,
            }}
          />
        )}
        <Text
          style={{
            ...theme.typography.eyebrow,
            color: onShift ? colors.onStageMuted : colors.textMuted,
          }}
        >
          {onShift ? driverCopy.home.onShiftEyebrow : driverCopy.home.offShiftEyebrow}
        </Text>
      </View>
      <Text
        accessibilityRole="header"
        style={{ ...theme.typography.headline, color: onShift ? colors.onStage : colors.text }}
      >
        {onShift ? driverCopy.home.waitingTitle : driverCopy.home.offShiftTitle}
      </Text>
      <Text
        style={{
          ...theme.typography.small,
          color: onShift ? colors.onStageMuted : colors.textMuted,
        }}
      >
        {onShift ? driverCopy.home.waitingBody : driverCopy.home.offShiftBody}
      </Text>
    </View>
  );

  if (!onShift) {
    return (
      <View
        testID="shift-hero"
        style={{
          backgroundColor: colors.surfaceSunken,
          minHeight: HERO_MIN_HEIGHT,
          paddingTop: topInset,
          paddingHorizontal: theme.spacing.gutter,
          paddingBottom: theme.spacing.lg,
        }}
      >
        {header}
        {body}
      </View>
    );
  }

  return (
    <Stage
      testID="shift-hero"
      topInset={topInset}
      style={{ minHeight: HERO_MIN_HEIGHT + topInset }}
    >
      <View
        style={{
          position: 'absolute',
          right: -PULSE_SIZE / 4,
          bottom: -PULSE_SIZE / 4,
          pointerEvents: 'none',
        }}
      >
        <RadarPulse
          size={PULSE_SIZE}
          rings={1}
          periodMs={PULSE_PERIOD_MS}
          color={colors.success}
          fillOpacity={PULSE_FILL_OPACITY}
          strokeOpacity={PULSE_STROKE_OPACITY}
        />
      </View>
      <View style={{ paddingHorizontal: theme.spacing.gutter, paddingBottom: theme.spacing.lg }}>
        {header}
        {body}
      </View>
    </Stage>
  );
}

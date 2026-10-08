import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, View } from 'react-native';
import {
  Button,
  CASH_PENDING_TONE,
  Card,
  MarkGlyph,
  PriceTag,
  StatusBadge,
  formatCOP,
  formatShortDateTime,
  motion,
  useReducedMotion,
  useTheme,
} from '@voyyaa/ui-mobile';
import type { PendingCashTrip } from '@voyyaa/shared';
import { driverCopy } from '../copy/driver-copy';

export interface CashPendingRowProps {
  trip: PendingCashTrip;
  loading: boolean;
  disabled: boolean;
  confirmed?: boolean;
  errorMessage?: string;
  onConfirm: () => void;
  onFolded?: () => void;
}

const CONFIRMED_HOLD_MS = 700;
const FOLD_MS = 280;
const CONFIRM_ROW_HEIGHT = 52;

export function CashPendingRow({
  trip,
  loading,
  disabled,
  confirmed = false,
  errorMessage,
  onConfirm,
  onFolded,
}: CashPendingRowProps): React.JSX.Element {
  const theme = useTheme();
  const reduced = useReducedMotion();
  const dateLabel = formatShortDateTime(trip.finished_at);
  const [measuredHeight, setMeasuredHeight] = useState<number | null>(null);
  const fold = useRef(new Animated.Value(1)).current;
  const onFoldedRef = useRef(onFolded);
  onFoldedRef.current = onFolded;

  useEffect(() => {
    if (!confirmed) return;
    if (reduced || measuredHeight === null) {
      const timer = setTimeout(() => onFoldedRef.current?.(), CONFIRMED_HOLD_MS);
      return () => clearTimeout(timer);
    }
    const animation = Animated.sequence([
      Animated.delay(CONFIRMED_HOLD_MS),
      Animated.timing(fold, {
        toValue: 0,
        duration: FOLD_MS,
        easing: motion.ease.out,
        useNativeDriver: false,
      }),
    ]);
    animation.start(({ finished }) => {
      if (finished) onFoldedRef.current?.();
    });
    return () => animation.stop();
  }, [confirmed, reduced, measuredHeight, fold]);

  const foldStyle =
    confirmed && measuredHeight !== null && !reduced
      ? {
          height: fold.interpolate({ inputRange: [0, 1], outputRange: [0, measuredHeight] }),
          opacity: fold,
          overflow: 'hidden' as const,
        }
      : undefined;

  return (
    <Animated.View style={foldStyle} testID="cash-pending-row">
      <View
        onLayout={(event) => {
          if (!confirmed) setMeasuredHeight(event.nativeEvent.layout.height);
        }}
      >
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
            <View style={{ flex: 1, gap: theme.spacing.xxs }}>
              <Text style={{ ...theme.typography.bodyStrong, color: theme.colors.text }}>
                {dateLabel}
              </Text>
              <Text
                style={{ ...theme.typography.small, color: theme.colors.textMuted }}
                numberOfLines={1}
              >
                {trip.dropoff_address}
              </Text>
              <View style={{ alignSelf: 'flex-start', marginTop: theme.spacing.xs }}>
                <StatusBadge label={CASH_PENDING_TONE.label} tone={CASH_PENDING_TONE.tone} />
              </View>
            </View>
            <PriceTag amountCOP={trip.fare} size="md" />
          </View>

          {errorMessage && (
            <Text
              accessibilityRole="alert"
              style={{
                ...theme.typography.small,
                color: theme.colors.dangerInk,
                marginTop: theme.spacing.sm,
              }}
            >
              {errorMessage}
            </Text>
          )}

          {confirmed ? (
            <View
              accessibilityRole="alert"
              testID="cash-confirmed"
              style={{
                minHeight: CONFIRM_ROW_HEIGHT,
                marginTop: theme.spacing.sm,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: theme.spacing.sm,
              }}
            >
              <MarkGlyph glyph="success" size={32} />
              <Text style={{ ...theme.typography.button, color: theme.colors.successInk }}>
                {driverCopy.cash.confirmed}
              </Text>
            </View>
          ) : (
            <Button
              label={driverCopy.cash.confirm}
              variant="go"
              loading={loading}
              loadingLabel={driverCopy.cash.confirming}
              disabled={disabled}
              accessibilityLabel={`Confirmar cobro del viaje del ${dateLabel}, ${formatCOP(trip.fare)}`}
              onPress={onConfirm}
              style={{ marginTop: theme.spacing.sm }}
              testID="cash-confirm"
            />
          )}
        </Card>
      </View>
    </Animated.View>
  );
}

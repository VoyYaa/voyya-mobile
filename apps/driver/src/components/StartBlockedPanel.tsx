import React from 'react';
import { Linking, Text, View } from 'react-native';
import { Button, Card, LinkButton, MarkGlyph, formatMMSS, useTheme } from '@voyyaa/ui-mobile';
import { driverCopy } from '../copy/driver-copy';

export type BlockedNoShow =
  | { kind: 'needs_arrival'; loading: boolean }
  | { kind: 'waiting'; remainingSec: number }
  | { kind: 'enabled' };

export interface StartBlockedPanelProps {
  passengerPhone: string | null;
  noShow: BlockedNoShow;
  onArrived: () => void;
  onNoShow: () => void;
  onCancel: () => void;
}

const copy = driverCopy.blocked;
const GLYPH_SIZE = 32;

export function StartBlockedPanel({
  passengerPhone,
  noShow,
  onArrived,
  onNoShow,
  onCancel,
}: StartBlockedPanelProps): React.JSX.Element {
  const theme = useTheme();

  return (
    <Card tone="danger" testID="start-blocked-panel">
      <View style={{ gap: theme.spacing.md }}>
        <View accessible accessibilityRole="header" style={{ gap: theme.spacing.sm }}>
          <MarkGlyph glyph="error" size={GLYPH_SIZE} animate={false} />
          <Text style={{ ...theme.typography.title, color: theme.colors.dangerInk }}>
            {copy.title}
          </Text>
        </View>
        <Text style={{ ...theme.typography.body, color: theme.colors.text }}>{copy.body}</Text>

        <Text style={{ ...theme.typography.subtitle, color: theme.colors.text }}>
          {copy.heading}
        </Text>

        {passengerPhone ? (
          <Button
            label={copy.callPassenger}
            size="lg"
            onPress={() => void Linking.openURL(`tel:${passengerPhone}`)}
            testID="blocked-call"
          />
        ) : (
          <Text style={{ ...theme.typography.small, color: theme.colors.textMuted }}>
            {copy.noPhone}
          </Text>
        )}

        {noShow.kind === 'needs_arrival' ? (
          <View style={{ gap: theme.spacing.xs }}>
            <Button
              label={driverCopy.trip.arrived}
              variant="secondary"
              size="lg"
              loading={noShow.loading}
              onPress={onArrived}
              testID="blocked-arrived"
            />
            <Text style={{ ...theme.typography.small, color: theme.colors.textMuted }}>
              {copy.needArrival}
            </Text>
          </View>
        ) : (
          <Button
            label={
              noShow.kind === 'waiting'
                ? driverCopy.trip.noShowIn(formatMMSS(noShow.remainingSec))
                : driverCopy.trip.noShow
            }
            variant="secondary"
            size="lg"
            disabled={noShow.kind === 'waiting'}
            onPress={onNoShow}
            testID="blocked-no-show"
          />
        )}

        <View style={{ gap: theme.spacing.xs }}>
          <LinkButton
            label={driverCopy.trip.cancelTrip}
            tone="danger"
            onPress={onCancel}
            testID="blocked-cancel"
          />
          <Text style={{ ...theme.typography.small, color: theme.colors.textMuted }}>
            {copy.advice}
          </Text>
        </View>
      </View>
    </Card>
  );
}

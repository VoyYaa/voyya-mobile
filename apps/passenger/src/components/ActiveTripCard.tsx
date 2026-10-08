import React from 'react';
import { Text, View } from 'react-native';
import { Button, Card, StatusBadge, tripStatusTone, useTheme } from '@voyyaa/ui-mobile';
import type { TripRequestStatus } from '@voyyaa/shared';
import { passengerCopy } from '../copy/passenger-copy';

export interface ActiveTripCardProps {
  trip: TripRequestStatus;
  originAddress?: string | null;
  destinationAddress?: string | null;
  onOpen: () => void;
}

const copy = passengerCopy.activeTrip;

export function ActiveTripCard({
  trip,
  originAddress,
  destinationAddress,
  onOpen,
}: ActiveTripCardProps): React.JSX.Element {
  const theme = useTheme();
  const tone = tripStatusTone(trip.status, { arrived: trip.arrived_at !== null });
  const route =
    originAddress && destinationAddress
      ? copy.routeSummary(originAddress, destinationAddress)
      : null;

  return (
    <Card tone="stage" testID="active-trip-card" style={{ gap: theme.spacing.md }}>
      <StatusBadge label={tone.label} tone={tone.tone} pulse={tone.pulse} />
      <View style={{ gap: theme.spacing.xs }}>
        <Text
          accessibilityRole="header"
          style={{ ...theme.typography.title, color: theme.colors.onStage }}
        >
          {copy.cardTitle}
        </Text>
        {route && (
          <Text style={{ ...theme.typography.small, color: theme.colors.onStageMuted }}>
            {route}
          </Text>
        )}
      </View>
      <Button
        label={copy.cardAction}
        size="lg"
        onPress={onOpen}
        accessibilityHint={copy.announce(tone.label)}
        testID="active-trip-open-button"
      />
    </Card>
  );
}

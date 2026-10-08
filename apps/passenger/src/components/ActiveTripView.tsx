import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AccentText,
  Card,
  LastUpdatedHint,
  LinkButton,
  PointRoute,
  PriceTag,
  ScreenHeader,
  Skeleton,
  Stage,
  useTheme,
} from '@voyyaa/ui-mobile';
import type { Location, TripRequestStatus } from '@voyyaa/shared';
import { formatEta } from '../lib/eta';
import { passengerCopy } from '../copy/passenger-copy';
import { DriverCard } from './DriverCard';
import { FreeCancelRail } from './FreeCancelRail';
import { TripStepRail, type TripStep } from './TripStepRail';

export interface ActiveTripViewProps {
  data: TripRequestStatus;
  step: TripStep;
  origin: Location | null;
  destination: Location | null;
  withinWindow: boolean;
  remainingSec: number;
  dataUpdatedAt: number;
  isStale: boolean;
  offline: boolean;
  onCancel: () => void;
}

const copy = passengerCopy.trip;
const DRIVER_SKELETON_HEIGHT = 168;

function StageSummary({
  data,
  step,
}: {
  data: TripRequestStatus;
  step: TripStep;
}): React.JSX.Element {
  const theme = useTheme();
  const eta = formatEta(data.driver?.eta ?? null);

  if (step === 2) {
    return (
      <View style={{ gap: theme.spacing.xs }}>
        <AccentText accent={copy.arrivedAccent} color={theme.colors.onStage} testID="trip-title">
          {copy.arrivedTitle}
        </AccentText>
        <Text style={{ ...theme.typography.body, color: theme.colors.onStageMuted }}>
          {copy.arrivedBody}
        </Text>
      </View>
    );
  }

  if (step === 3) {
    return (
      <View style={{ gap: theme.spacing.xs }}>
        <Text
          accessibilityRole="header"
          style={{ ...theme.typography.headline, color: theme.colors.onStage }}
          testID="trip-title"
        >
          {copy.inProgressTitle}
        </Text>
        <PriceTag amountCOP={data.fare.total} size="xl" color={theme.colors.onStage} />
        <Text style={{ ...theme.typography.small, color: theme.colors.onStageMuted }}>
          {copy.fareLabel}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ gap: theme.spacing.xs }}>
      <Text
        accessibilityRole="header"
        style={{ ...theme.typography.headline, color: theme.colors.onStage }}
        testID="trip-title"
      >
        {copy.enRouteTitle}
      </Text>
      <View
        accessible
        accessibilityLabel={`${copy.etaLabel} ${eta ?? copy.etaCalculating}`}
        style={{ flexDirection: 'row', alignItems: 'baseline', gap: theme.spacing.sm }}
      >
        <Text style={{ ...theme.typography.small, color: theme.colors.onStageMuted }}>
          {copy.etaLabel}
        </Text>
        <Text
          testID="trip-eta"
          style={{
            ...(eta ? theme.typography.numericXL : theme.typography.title),
            color: theme.colors.onStage,
          }}
        >
          {eta ?? copy.etaCalculating}
        </Text>
      </View>
    </View>
  );
}

export function ActiveTripView({
  data,
  step,
  origin,
  destination,
  withinWindow,
  remainingSec,
  dataUpdatedAt,
  isStale,
  offline,
  onCancel,
}: ActiveTripViewProps): React.JSX.Element {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const inProgress = step === 3;

  return (
    <View style={{ flex: 1 }}>
      <Stage topInset={insets.top} testID="trip-stage">
        <ScreenHeader tone="stage" title={copy.header} />
        <View
          style={{
            paddingHorizontal: theme.spacing.gutter,
            paddingBottom: theme.spacing.xl,
            gap: theme.spacing.lg,
          }}
        >
          <TripStepRail current={step} />
          <StageSummary data={data} step={step} />
        </View>
      </Stage>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: theme.spacing.lg,
          paddingBottom: theme.spacing.xl + insets.bottom,
          gap: theme.spacing.md,
        }}
      >
        <LastUpdatedHint updatedAtMs={dataUpdatedAt} isStale={isStale} />

        {data.driver ? (
          <DriverCard driver={data.driver} />
        ) : (
          <Skeleton height={DRIVER_SKELETON_HEIGHT} radius={theme.radius.card} accent />
        )}

        {origin && destination && (
          <Card>
            <PointRoute
              origin={{ label: copy.pickupLabel, value: origin.address }}
              destination={{ label: copy.destinationLabel, value: destination.address }}
            />
          </Card>
        )}

        {!inProgress && withinWindow && <FreeCancelRail remainingSec={remainingSec} />}

        {!inProgress && (
          <View style={{ alignItems: 'center' }}>
            <LinkButton
              label={copy.cancelTrip}
              tone="danger"
              disabled={offline}
              accessibilityHint={offline ? copy.cancelOfflineHint : undefined}
              onPress={onCancel}
              style={{ alignSelf: 'center' }}
              testID="cancel-trip-link"
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

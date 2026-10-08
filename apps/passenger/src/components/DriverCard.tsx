import React from 'react';
import { Linking, Text, View } from 'react-native';
import { Button, Card, useTheme } from '@voyyaa/ui-mobile';
import type { AssignedDriverSummary } from '@voyyaa/shared';
import { passengerCopy } from '../copy/passenger-copy';
import { PlateTag } from './PlateTag';

export interface DriverCardProps {
  driver: AssignedDriverSummary;
}

const AVATAR_SIZE = 52;

export function DriverCard({ driver }: DriverCardProps): React.JSX.Element {
  const theme = useTheme();
  const canCall = Boolean(driver.contact_phone);

  return (
    <Card testID="driver-card">
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={{
            width: AVATAR_SIZE,
            height: AVATAR_SIZE,
            borderRadius: AVATAR_SIZE / 2,
            backgroundColor: theme.colors.stage,
            borderWidth: 2,
            borderColor: theme.colors.brand,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ ...theme.typography.title, color: theme.colors.onStage }}>
            {driver.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{ ...theme.typography.subtitle, color: theme.colors.text }}
            numberOfLines={1}
          >
            {driver.name}
          </Text>
          <Text
            style={{ ...theme.typography.small, color: theme.colors.textMuted }}
            numberOfLines={1}
          >
            {driver.model ?? passengerCopy.trip.vehicleFallback}
          </Text>
        </View>
      </View>
      <View style={{ marginTop: theme.spacing.md }}>
        <PlateTag plate={driver.plate} />
      </View>
      <View style={{ marginTop: theme.spacing.lg }}>
        <Button
          label={passengerCopy.trip.callDriver}
          variant={theme.mode === 'dark' ? 'ghost' : 'secondary'}
          disabled={!canCall}
          accessibilityHint={canCall ? undefined : passengerCopy.trip.callUnavailable}
          onPress={() => {
            if (driver.contact_phone) {
              void Linking.openURL(`tel:${driver.contact_phone}`);
            }
          }}
          testID="call-driver-button"
        />
      </View>
    </Card>
  );
}

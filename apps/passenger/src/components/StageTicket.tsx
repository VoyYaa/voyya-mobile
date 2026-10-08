import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { BRAND_COLORS, Card, Chip, PriceTag, useTheme } from '@voyyaa/ui-mobile';
import { passengerCopy } from '../copy/passenger-copy';

export interface StageTicketProps {
  originAddress: string;
  destinationAddress: string;
  total: number;
  testID?: string;
}

const PIN_SIZE = 24;
const CONNECTOR_HEIGHT = 14;

function OriginPin(): React.JSX.Element {
  const theme = useTheme();
  return (
    <Svg width={PIN_SIZE} height={PIN_SIZE} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={8} fill="none" stroke={theme.colors.onStage} strokeWidth={2} />
      <Circle cx={12} cy={12} r={4.5} fill={BRAND_COLORS.amber} />
    </Svg>
  );
}

function DestinationPin(): React.JSX.Element {
  const theme = useTheme();
  return (
    <Svg width={PIN_SIZE} height={PIN_SIZE} viewBox="0 0 24 24">
      <Path
        d="M12 2.5 a7 7 0 0 1 7 7 c0 6 -7 12 -7 12 s-7 -6 -7 -12 a7 7 0 0 1 7 -7 Z"
        fill={theme.colors.onStage}
      />
      <Circle cx={12} cy={9.5} r={2.6} fill={theme.colors.stageRaised} />
    </Svg>
  );
}

function RouteStop({
  pin,
  address,
}: {
  pin: React.JSX.Element;
  address: string;
}): React.JSX.Element {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {pin}
      </View>
      <Text
        numberOfLines={1}
        style={{ ...theme.typography.bodyStrong, color: theme.colors.onStage, flex: 1 }}
      >
        {address}
      </Text>
    </View>
  );
}

export function StageTicket({
  originAddress,
  destinationAddress,
  total,
  testID = 'search-ticket',
}: StageTicketProps): React.JSX.Element {
  const theme = useTheme();

  return (
    <Card tone="stage" testID={testID} style={{ alignSelf: 'stretch' }}>
      <RouteStop pin={<OriginPin />} address={originAddress} />
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{ width: PIN_SIZE, height: CONNECTOR_HEIGHT, alignItems: 'center' }}
      >
        <Svg width={2} height={CONNECTOR_HEIGHT}>
          <Line
            x1={1}
            y1={0}
            x2={1}
            y2={CONNECTOR_HEIGHT}
            stroke={theme.colors.onStageMuted}
            strokeWidth={2}
            strokeDasharray="3 4"
            strokeLinecap="round"
          />
        </Svg>
      </View>
      <RouteStop pin={<DestinationPin />} address={destinationAddress} />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: theme.spacing.md,
          gap: theme.spacing.sm,
        }}
      >
        <Chip label={passengerCopy.searching.cash} tone="brandTint" />
        <PriceTag amountCOP={total} size="lg" color={theme.colors.onStage} />
      </View>
    </Card>
  );
}

import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { useTheme } from '../theme';
import { uiCopy } from '../copy';

export type RoutePinKind = 'origin' | 'destination';

export interface RoutePinProps {
  kind: RoutePinKind;
  size?: number;
  color?: string;
}

export function RoutePin({ kind, size = 24, color }: RoutePinProps): React.JSX.Element {
  const theme = useTheme();
  const ink = color ?? theme.colors.text;

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: size, height: size }}
    >
      <Svg width={size} height={size} viewBox="0 0 24 24">
        {kind === 'origin' ? (
          <>
            <Circle cx={12} cy={12} r={8} fill="none" stroke={ink} strokeWidth={2} />
            <Circle cx={12} cy={12} r={4.5} fill={theme.colors.brand} />
          </>
        ) : (
          <>
            <Path
              d="M12 2.5 a7 7 0 0 1 7 7 c0 6 -7 12 -7 12 s-7 -6 -7 -12 a7 7 0 0 1 7 -7 Z"
              fill={ink}
            />
            <Circle cx={12} cy={9.5} r={2.6} fill={theme.colors.bg} />
          </>
        )}
      </Svg>
    </View>
  );
}

export interface PointRowProps {
  marker?: '●' | '▼';
  kind?: RoutePinKind;
  label: string;
  value: string;
  markerColor?: string;
}

export function PointRow({
  marker = '●',
  kind,
  label,
  value,
  markerColor,
}: PointRowProps): React.JSX.Element {
  const theme = useTheme();
  const resolvedKind: RoutePinKind = kind ?? (marker === '▼' ? 'destination' : 'origin');

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.md }}>
      <View style={{ paddingTop: 2 }}>
        <RoutePin kind={resolvedKind} color={markerColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ ...theme.typography.small, color: theme.colors.textMuted }}>{label}</Text>
        <Text
          style={{ ...theme.typography.bodyStrong, color: theme.colors.text }}
          numberOfLines={1}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

export interface PointRouteStop {
  label?: string;
  value: string;
  markerColor?: string;
}

export interface PointRouteProps {
  origin: PointRouteStop;
  destination: PointRouteStop;
}

const CONNECTOR_HEIGHT = 18;
const PIN_SIZE = 24;

export function PointRoute({ origin, destination }: PointRouteProps): React.JSX.Element {
  const theme = useTheme();

  return (
    <View>
      <PointRow
        kind="origin"
        label={origin.label ?? uiCopy.routeOrigin}
        value={origin.value}
        markerColor={origin.markerColor}
      />
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{ width: PIN_SIZE, height: CONNECTOR_HEIGHT }}
      >
        <Svg width={PIN_SIZE} height={CONNECTOR_HEIGHT}>
          <Line
            x1={PIN_SIZE / 2}
            y1={0}
            x2={PIN_SIZE / 2}
            y2={CONNECTOR_HEIGHT}
            stroke={theme.colors.borderStrong}
            strokeWidth={2}
            strokeDasharray="3 4"
            strokeLinecap="round"
          />
        </Svg>
      </View>
      <PointRow
        kind="destination"
        label={destination.label ?? uiCopy.routeDestination}
        value={destination.value}
        markerColor={destination.markerColor}
      />
    </View>
  );
}

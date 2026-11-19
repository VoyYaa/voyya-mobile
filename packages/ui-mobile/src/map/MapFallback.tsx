import React from 'react';
import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { mapCopy } from '../copy';
import { useTheme } from '../theme';
import { fallbackRows, hasRouteSchematic } from './fallback-rows';
import { MapSchematic } from './MapSchematic';
import type { MapMarker } from './types';

export const MAP_WEB_UNAVAILABLE_LABEL = mapCopy.webUnavailable;

const COMPACT_HEIGHT = 140;

export interface MapFallbackProps {
  label?: string;
  markers?: readonly MapMarker[];
  height?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function MapFallback({
  label,
  markers,
  height = 200,
  style,
  testID,
}: MapFallbackProps): React.JSX.Element {
  const theme = useTheme();
  const rows = fallbackRows(markers);
  const compact = height < COMPACT_HEIGHT;
  const showSchematic = hasRouteSchematic(markers);

  return (
    <View
      testID={testID}
      accessibilityElementsHidden={!rows.length}
      importantForAccessibility={rows.length ? 'auto' : 'no-hide-descendants'}
      style={[
        {
          minHeight: height,
          borderRadius: theme.radius.card,
          backgroundColor: theme.colors.surfaceAlt,
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: theme.spacing.sm,
          paddingHorizontal: theme.spacing.lg,
          borderWidth: 1,
          borderColor: theme.colors.border,
        },
        style,
      ]}
    >
      {showSchematic && !compact && <MapSchematic withRoute />}
      <Text style={{ ...theme.typography.smallStrong, color: theme.colors.textMuted }}>
        {label ?? mapCopy.unavailable}
      </Text>
      {rows.map((row) => (
        <Text
          key={row.id}
          numberOfLines={2}
          style={{ ...theme.typography.small, color: theme.colors.text, marginTop: 2 }}
        >
          {row.text}
        </Text>
      ))}
    </View>
  );
}

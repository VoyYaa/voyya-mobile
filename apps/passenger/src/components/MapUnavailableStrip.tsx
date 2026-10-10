import React from 'react';
import { Text, View } from 'react-native';
import { MarkGlyph, useTheme } from '@voyyaa/ui-mobile';
import { passengerCopy } from '../copy/passenger-copy';

const STRIP_HEIGHT = 40;
const GLYPH_SIZE = 16;

export function MapUnavailableStrip(): React.JSX.Element {
  const theme = useTheme();

  return (
    <View
      testID="map-unavailable-strip"
      style={{
        minHeight: STRIP_HEIGHT,
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.sm,
        backgroundColor: theme.colors.surfaceAlt,
      }}
    >
      <MarkGlyph glyph="pin" size={GLYPH_SIZE} animate={false} />
      <Text style={{ ...theme.typography.small, color: theme.colors.textMuted, flex: 1 }}>
        {passengerCopy.tracking.mapUnavailable}
      </Text>
    </View>
  );
}

import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../theme';
import { LABEL_HEIGHT } from './marker-geometry';

export interface MapMarkerLabelProps {
  text: string;
  testID?: string;
}

export const MAP_LABEL_MAX_FONT_SCALE = 1.3;

export function MapMarkerLabel({ text, testID }: MapMarkerLabelProps): React.JSX.Element {
  const { colors, typography, radius, shadow, spacing } = useTheme();
  return (
    <View
      testID={testID}
      style={{
        minHeight: LABEL_HEIGHT,
        paddingHorizontal: spacing.sm,
        justifyContent: 'center',
        borderRadius: radius.pill,
        backgroundColor: colors.mapLabelSurface,
        ...shadow.sm,
      }}
    >
      <Text
        maxFontSizeMultiplier={MAP_LABEL_MAX_FONT_SCALE}
        numberOfLines={1}
        style={{ ...typography.smallStrong, color: colors.text }}
      >
        {text}
      </Text>
    </View>
  );
}

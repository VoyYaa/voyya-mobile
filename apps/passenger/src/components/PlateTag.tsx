import React from 'react';
import { Text, View } from 'react-native';
import { BRAND_COLORS, useTheme } from '@voyyaa/ui-mobile';
import { passengerCopy } from '../copy/passenger-copy';

export interface PlateTagProps {
  plate: string;
  testID?: string;
}

const PLATE_FONT_SIZE = 22;

export function PlateTag({ plate, testID = 'plate-tag' }: PlateTagProps): React.JSX.Element {
  const theme = useTheme();

  return (
    <View
      testID={testID}
      accessible
      accessibilityLabel={passengerCopy.trip.plateLabel(plate)}
      style={{
        alignSelf: 'flex-start',
        backgroundColor: BRAND_COLORS.amber,
        borderColor: BRAND_COLORS.espresso,
        borderWidth: 2,
        borderRadius: 8,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
      }}
    >
      <Text
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{
          ...theme.typography.numeric,
          fontSize: PLATE_FONT_SIZE,
          lineHeight: PLATE_FONT_SIZE + 4,
          letterSpacing: 1.5,
          color: BRAND_COLORS.espresso,
        }}
      >
        {plate}
      </Text>
    </View>
  );
}

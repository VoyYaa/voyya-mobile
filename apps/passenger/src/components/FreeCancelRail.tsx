import React from 'react';
import { Text, View } from 'react-native';
import { formatMMSS, useTheme } from '@voyyaa/ui-mobile';
import { FREE_CANCELLATION_WINDOW_MIN } from '../constants/parameters';
import { passengerCopy } from '../copy/passenger-copy';

export interface FreeCancelRailProps {
  remainingSec: number;
}

const TRACK_HEIGHT = 4;
const WINDOW_SEC = FREE_CANCELLATION_WINDOW_MIN * 60;

export function FreeCancelRail({ remainingSec }: FreeCancelRailProps): React.JSX.Element {
  const theme = useTheme();
  const ratio = Math.min(1, Math.max(0, remainingSec / WINDOW_SEC));

  return (
    <View
      testID="free-cancel-rail"
      accessible
      accessibilityLabel={passengerCopy.trip.freeCancellation(formatMMSS(remainingSec))}
      style={{ gap: theme.spacing.xs }}
    >
      <Text
        accessibilityElementsHidden
        style={{ ...theme.typography.smallStrong, color: theme.colors.successInk }}
      >
        {passengerCopy.trip.freeCancellation(formatMMSS(remainingSec))}
      </Text>
      <View
        accessibilityElementsHidden
        style={{
          height: TRACK_HEIGHT,
          borderRadius: TRACK_HEIGHT / 2,
          backgroundColor: theme.colors.successTint,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            width: `${ratio * 100}%`,
            height: TRACK_HEIGHT,
            backgroundColor: theme.colors.success,
          }}
        />
      </View>
    </View>
  );
}

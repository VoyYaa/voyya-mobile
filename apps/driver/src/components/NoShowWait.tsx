import React from 'react';
import { Text, View } from 'react-native';
import { CountdownRing, formatMMSS, useTheme } from '@voyyaa/ui-mobile';
import { driverCopy } from '../copy/driver-copy';

export interface NoShowWaitProps {
  remainingSec: number;
  totalSec: number;
}

const RING_SIZE = 88;
const NEVER_WARN_SEC = -1;

function spokenRemaining(remainingSec: number): string {
  const minutes = Math.floor(remainingSec / 60);
  const seconds = remainingSec % 60;
  const parts: string[] = [];
  if (minutes > 0) parts.push(`${minutes} minuto${minutes === 1 ? '' : 's'}`);
  parts.push(`${seconds} segundo${seconds === 1 ? '' : 's'}`);
  return `Disponible en ${parts.join(' con ')}`;
}

export function NoShowWait({ remainingSec, totalSec }: NoShowWaitProps): React.JSX.Element {
  const theme = useTheme();

  return (
    <View
      testID="no-show-wait"
      style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}
    >
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{ width: RING_SIZE, height: RING_SIZE }}
      >
        <CountdownRing
          durationSec={totalSec}
          remainingSec={remainingSec}
          status="counting"
          warnThresholdSec={NEVER_WARN_SEC}
          reducedMotion
          size={RING_SIZE}
        />
      </View>
      <Text
        accessibilityLabel={`${driverCopy.trip.noShow}. ${spokenRemaining(remainingSec)}`}
        style={{ ...theme.typography.small, color: theme.colors.textMuted, flex: 1 }}
      >
        {driverCopy.trip.noShowIn(formatMMSS(remainingSec))}
      </Text>
    </View>
  );
}

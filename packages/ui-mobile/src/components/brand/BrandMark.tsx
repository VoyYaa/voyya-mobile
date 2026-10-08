import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTheme } from '../../theme';
import { BRAND_COLORS } from '../../tokens';

export type BrandMarkRole = 'passenger' | 'driver' | 'neutral';
export type BrandMarkTone = 'onDark' | 'onLight';

export interface BrandMarkProps {
  size?: number;
  role?: BrandMarkRole;
  tone?: BrandMarkTone;
  wordmark?: boolean;
  testID?: string;
}

const DRIVER_TAIL_PATH = 'M170.7,170.7 L160.1,138.9 L138.9,160.1 Z';

function ringColorFor(role: BrandMarkRole): { color: string; opacity: number } {
  if (role === 'driver') return { color: BRAND_COLORS.go, opacity: 0.85 };
  if (role === 'neutral') return { color: BRAND_COLORS.crema, opacity: 0.65 };
  return { color: BRAND_COLORS.amber, opacity: 0.65 };
}

export function BrandMark({
  size = 48,
  role = 'passenger',
  tone = 'onDark',
  wordmark = false,
  testID,
}: BrandMarkProps): React.JSX.Element {
  const theme = useTheme();
  const ring = ringColorFor(role);
  const onLight = tone === 'onLight';

  const glyph = (
    <Svg width={size} height={size} viewBox={onLight ? '-20 -20 240 240' : '0 0 200 200'}>
      {onLight && <Circle cx={100} cy={100} r={120} fill={BRAND_COLORS.espresso} />}
      <Circle cx={100} cy={100} r={27} fill={BRAND_COLORS.amber} />
      <Circle
        cx={100}
        cy={100}
        r={47}
        fill="none"
        stroke={ring.color}
        strokeOpacity={ring.opacity}
        strokeWidth={8}
      />
      {role === 'driver' && (
        <Path d={DRIVER_TAIL_PATH} fill={ring.color} fillOpacity={ring.opacity} />
      )}
    </Svg>
  );

  if (!wordmark) {
    return (
      <View
        testID={testID}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {glyph}
      </View>
    );
  }

  return (
    <View
      testID={testID}
      accessible
      accessibilityLabel="VoyYa"
      style={{ flexDirection: 'row', alignItems: 'center', gap: Math.round(size * 0.2) }}
    >
      {glyph}
      <Text
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{
          ...theme.typography.display,
          fontSize: Math.round(size * 0.62),
          lineHeight: Math.round(size * 0.72),
          color: onLight ? theme.colors.text : theme.colors.onStage,
        }}
      >
        VoyYa
      </Text>
    </View>
  );
}

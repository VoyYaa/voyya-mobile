import React from 'react';
import {
  Platform,
  SafeAreaView,
  StatusBar,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useTheme } from '../theme';
import { BRAND_COLORS } from '../tokens';

export interface StageProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  safeTop?: boolean;
  topInset?: number;
  glow?: boolean;
  testID?: string;
}

export function Stage({
  children,
  style,
  safeTop = false,
  topInset,
  glow = true,
  testID,
}: StageProps): React.JSX.Element {
  const theme = useTheme();
  const reachesStatusBar = safeTop || topInset !== undefined;
  const useSystemInset = safeTop && topInset === undefined && Platform.OS === 'ios';
  const contentStyle = { flex: 1, paddingTop: topInset ?? 0 } as const;

  return (
    <View
      testID={testID}
      style={[{ backgroundColor: theme.colors.stage, overflow: 'hidden' }, style]}
    >
      {reachesStatusBar && <StatusBar barStyle="light-content" />}
      {glow && (
        <Svg
          pointerEvents="none"
          width="100%"
          height="100%"
          style={{ position: 'absolute', top: 0, left: 0 }}
          preserveAspectRatio="none"
        >
          <Defs>
            <RadialGradient id="vy-stage-glow" cx="50%" cy="22%" rx="70%" ry="55%">
              <Stop offset="0%" stopColor={BRAND_COLORS.amber} stopOpacity={0.1} />
              <Stop offset="100%" stopColor={BRAND_COLORS.amber} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#vy-stage-glow)" />
        </Svg>
      )}
      {useSystemInset ? (
        <SafeAreaView style={contentStyle}>{children}</SafeAreaView>
      ) : (
        <View style={contentStyle}>{children}</View>
      )}
    </View>
  );
}

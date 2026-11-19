import React from 'react';
import { Pressable } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useFocusState } from '../hooks/useFocusState';
import { useTheme } from '../theme';

export type MapControlIcon = 'recenter' | 'expand' | 'locate' | 'close';

export interface MapControlButtonProps {
  icon: MapControlIcon;
  label: string;
  onPress: () => void;
  testID?: string;
}

const ICON_SIZE = 24;

function IconShape({ icon, color }: { icon: MapControlIcon; color: string }): React.JSX.Element {
  switch (icon) {
    case 'recenter':
      return (
        <>
          <Circle cx={12} cy={12} r={3} fill={color} />
          <Circle cx={12} cy={12} r={7.5} fill="none" stroke={color} strokeWidth={2} />
          <Path d="M12 2 V5 M12 19 V22 M2 12 H5 M19 12 H22" stroke={color} strokeWidth={2} />
        </>
      );
    case 'locate':
      return (
        <Path
          d="M20.5 3.5 L3.5 10.5 L10.5 13.5 L13.5 20.5 Z"
          fill={color}
          stroke={color}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      );
    case 'expand':
      return (
        <Path
          d="M4 9 V4 H9 M15 4 H20 V9 M20 15 V20 H15 M9 20 H4 V15"
          fill="none"
          stroke={color}
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    case 'close':
      return (
        <Path
          d="M6 6 L18 18 M18 6 L6 18"
          fill="none"
          stroke={color}
          strokeWidth={2.4}
          strokeLinecap="round"
        />
      );
  }
}

export function MapControlButton({
  icon,
  label,
  onPress,
  testID,
}: MapControlButtonProps): React.JSX.Element {
  const { colors, touch, radius, shadow } = useTheme();
  const { focused, onFocus, onBlur } = useFocusState();

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      onFocus={onFocus}
      onBlur={onBlur}
      style={{
        width: touch.min,
        height: touch.min,
        borderRadius: radius.pill,
        backgroundColor: colors.mapLabelSurface,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: focused ? 2 : 0,
        borderColor: colors.focusRing,
        ...shadow.md,
      }}
    >
      <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24">
        <IconShape icon={icon} color={colors.text} />
      </Svg>
    </Pressable>
  );
}

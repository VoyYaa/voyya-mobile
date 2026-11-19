import React from 'react';
import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { mapCopy } from '../copy';
import { useTheme } from '../theme';
import { MapSchematic } from './MapSchematic';

export interface MapPlaceholderProps {
  height?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function MapPlaceholder({
  height = 200,
  style,
  testID,
}: MapPlaceholderProps): React.JSX.Element {
  const theme = useTheme();

  return (
    <View
      testID={testID}
      accessible
      accessibilityLabel={mapCopy.placeholder}
      style={[
        {
          height,
          borderRadius: theme.radius.card,
          backgroundColor: theme.colors.surfaceAlt,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: theme.colors.border,
        },
        style,
      ]}
    >
      <MapSchematic withRoute={false} width={96} />
      <Text style={{ ...theme.typography.small, color: theme.colors.textMuted }}>
        {mapCopy.placeholder}
      </Text>
    </View>
  );
}

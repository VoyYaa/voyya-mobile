import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../theme';

export interface PointRowProps {
  marker: '●' | '▼';
  label: string;
  value: string;
  markerColor?: string;
}

export function PointRow({ marker, label, value, markerColor }: PointRowProps): React.JSX.Element {
  const theme = useTheme();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.sm }}>
      <Text style={{ color: markerColor ?? theme.colors.text, fontSize: 16, lineHeight: 20 }}>
        {marker}
      </Text>
      <View style={{ flex: 1 }}>
        <Text style={{ ...theme.typography.small, color: theme.colors.textMuted }}>{label}</Text>
        <Text style={{ ...theme.typography.body, color: theme.colors.text }} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );
}

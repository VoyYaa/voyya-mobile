import React from 'react';
import { Text, View, type TextStyle } from 'react-native';
import { useTheme } from '../../theme';
import { GalleryCaption, GalleryRow, GallerySection } from '../GallerySection';

const SWATCH_SIZE = 44;

export function ColorSection(): React.JSX.Element {
  const theme = useTheme();
  const entries = Object.entries(theme.colors) as [string, string][];

  return (
    <GallerySection title="Color">
      <GalleryRow align="flex-start">
        {entries.map(([name, value]) => (
          <View key={name} style={{ width: 96, gap: theme.spacing.xs }}>
            <View
              style={{
                width: SWATCH_SIZE,
                height: SWATCH_SIZE,
                borderRadius: theme.radius.chip,
                backgroundColor: value,
                borderWidth: 1,
                borderColor: theme.colors.borderStrong,
              }}
            />
            <Text style={{ ...theme.typography.small, color: theme.colors.text }} numberOfLines={1}>
              {name}
            </Text>
          </View>
        ))}
      </GalleryRow>
    </GallerySection>
  );
}

export function TypographySection(): React.JSX.Element {
  const theme = useTheme();
  const entries = Object.entries(theme.typography) as [string, TextStyle][];

  return (
    <GallerySection title="Tipografía">
      <GalleryCaption label={theme.fontsReady ? 'Nunito (T1)' : 'Pesos de sistema (T0)'} />
      {entries.map(([name, style]) => (
        <View key={name}>
          <GalleryCaption label={name} />
          <Text style={{ ...style, color: theme.colors.text }}>
            Tu taxi, sin llamar a nadie. 8.000
          </Text>
        </View>
      ))}
    </GallerySection>
  );
}

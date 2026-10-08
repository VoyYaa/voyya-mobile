import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../theme';

export interface GallerySectionProps {
  title: string;
  children: React.ReactNode;
}

export function GallerySection({ title, children }: GallerySectionProps): React.JSX.Element {
  const theme = useTheme();

  return (
    <View
      style={{
        gap: theme.spacing.md,
        paddingVertical: theme.spacing.lg,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
      }}
    >
      <Text
        accessibilityRole="header"
        style={{ ...theme.typography.eyebrow, color: theme.colors.brandInk }}
      >
        {title}
      </Text>
      {children}
    </View>
  );
}

export interface GalleryRowProps {
  children: React.ReactNode;
  align?: 'flex-start' | 'center';
}

export function GalleryRow({ children, align = 'center' }: GalleryRowProps): React.JSX.Element {
  const theme = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: align,
        gap: theme.spacing.md,
      }}
    >
      {children}
    </View>
  );
}

export interface GalleryCaptionProps {
  label: string;
}

export function GalleryCaption({ label }: GalleryCaptionProps): React.JSX.Element {
  const theme = useTheme();
  return <Text style={{ ...theme.typography.small, color: theme.colors.textSubtle }}>{label}</Text>;
}

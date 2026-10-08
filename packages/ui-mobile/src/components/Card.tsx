import React from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../theme';
import { motion } from '../tokens';
import { useFocusState } from '../hooks/useFocusState';
import { useReducedMotion } from '../hooks/useReducedMotion';

export type CardTone = 'surface' | 'alt' | 'sunken' | 'tint' | 'stage' | 'raised' | 'danger';

export interface CardProps {
  children: React.ReactNode;
  tone?: CardTone;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

export function Card({
  children,
  tone = 'surface',
  onPress,
  disabled = false,
  style,
  accessibilityLabel,
  accessibilityHint,
  testID,
}: CardProps): React.JSX.Element {
  const theme = useTheme();
  const reduced = useReducedMotion();
  const { focused, onFocus, onBlur } = useFocusState();
  const { colors } = theme;

  const surfaces: Record<CardTone, { bg: string; border: string }> = {
    surface: { bg: colors.surface, border: colors.border },
    alt: { bg: colors.brandTint, border: 'transparent' },
    tint: { bg: colors.brandTint, border: 'transparent' },
    sunken: { bg: colors.surfaceSunken, border: 'transparent' },
    stage: { bg: colors.stageRaised, border: 'transparent' },
    raised: { bg: colors.surfaceRaised, border: 'transparent' },
    danger: { bg: colors.dangerTint, border: 'transparent' },
  };
  const surface = surfaces[tone];

  const content = (
    <View
      testID={onPress ? undefined : testID}
      style={[
        {
          backgroundColor: surface.bg,
          borderRadius: theme.radius.card,
          padding: theme.spacing.lg,
          borderWidth: 1,
          borderColor: focused ? colors.focusRing : surface.border,
        },
        tone === 'raised' ? theme.shadow.md : null,
        style,
      ]}
    >
      {children}
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable
      onPress={onPress}
      onFocus={onFocus}
      onBlur={onBlur}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      testID={testID}
      style={({ pressed }) => ({
        minHeight: theme.touch.min,
        opacity: disabled ? 0.5 : 1,
        transform: [{ scale: pressed && !reduced ? motion.pressScale : 1 }],
      })}
    >
      {content}
    </Pressable>
  );
}

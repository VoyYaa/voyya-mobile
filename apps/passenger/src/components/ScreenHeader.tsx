import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '@voyyaa/ui-mobile';
import { useRouter } from 'expo-router';

export interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  hideBack?: boolean;
  right?: React.ReactNode;
}

export function ScreenHeader({ title, onBack, hideBack = false, right }: ScreenHeaderProps): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const handleBack = onBack ?? (() => router.back());

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.sm,
        minHeight: 56,
      }}
    >
      <View style={{ width: theme.touch.min }}>
        {!hideBack && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver"
            onPress={handleBack}
            hitSlop={8}
            style={{ width: theme.touch.min, height: theme.touch.min, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ ...theme.typography.title, color: theme.colors.text }}>←</Text>
          </Pressable>
        )}
      </View>
      <Text
        accessibilityRole="header"
        numberOfLines={1}
        style={{ ...theme.typography.subtitle, color: theme.colors.text, flex: 1, textAlign: 'center' }}
      >
        {title}
      </Text>
      <View style={{ width: theme.touch.min, alignItems: 'flex-end' }}>{right}</View>
    </View>
  );
}

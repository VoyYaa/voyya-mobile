import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../theme';

export type ToastTone = 'neutral' | 'success' | 'danger';

export interface ToastProps {
  message: string;
  tone?: ToastTone;
  visible: boolean;
  onHide: () => void;
  durationMs?: number;
}

export function Toast({ message, tone = 'neutral', visible, onHide, durationMs = 2200 }: ToastProps): React.JSX.Element | null {
  const theme = useTheme();

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(onHide, durationMs);
    return () => clearTimeout(timer);
  }, [visible, durationMs, onHide]);

  if (!visible) return null;

  const toneColors: Record<ToastTone, { bg: string; fg: string }> = {
    neutral: { bg: theme.colors.text, fg: theme.colors.bg },
    success: { bg: theme.colors.success, fg: theme.colors.onSuccess },
    danger: { bg: theme.colors.danger, fg: theme.colors.onDanger },
  };
  const palette = toneColors[tone];

  return (
    <View
      accessibilityLiveRegion="polite"
      style={{
        position: 'absolute',
        left: theme.spacing.lg,
        right: theme.spacing.lg,
        bottom: theme.spacing.xxl,
        backgroundColor: palette.bg,
        borderRadius: theme.radius.button,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        ...theme.shadow.md,
      }}
    >
      <Text style={{ ...theme.typography.body, fontWeight: '600', color: palette.fg, textAlign: 'center' }}>
        {message}
      </Text>
    </View>
  );
}

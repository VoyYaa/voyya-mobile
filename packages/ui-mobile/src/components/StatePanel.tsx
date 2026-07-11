import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../theme';
import { Button, type ButtonProps } from './Button';

export interface StatePanelAction {
  label: string;
  onPress: ButtonProps['onPress'];
  variant?: ButtonProps['variant'];
}

export interface StatePanelProps {
  icon?: string;
  title: string;
  body?: string;
  primaryAction?: StatePanelAction;
  secondaryAction?: StatePanelAction;
  accessibilityRole?: 'alert' | 'none';
}

export function StatePanel({
  icon,
  title,
  body,
  primaryAction,
  secondaryAction,
  accessibilityRole = 'none',
}: StatePanelProps): React.JSX.Element {
  const theme = useTheme();

  return (
    <View
      accessibilityRole={accessibilityRole === 'alert' ? 'alert' : undefined}
      style={{ alignItems: 'center', padding: theme.spacing.xl, gap: theme.spacing.sm as number }}
    >
      {icon && (
        <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ fontSize: 40 }}>
          {icon}
        </Text>
      )}
      <Text accessibilityRole="header" style={{ ...theme.typography.title, color: theme.colors.text, textAlign: 'center' }}>
        {title}
      </Text>
      {body && (
        <Text style={{ ...theme.typography.body, color: theme.colors.textMuted, textAlign: 'center' }}>{body}</Text>
      )}
      {(primaryAction || secondaryAction) && (
        <View style={{ width: '100%', gap: theme.spacing.sm as number, marginTop: theme.spacing.md }}>
          {primaryAction && (
            <Button label={primaryAction.label} onPress={primaryAction.onPress} variant={primaryAction.variant ?? 'primary'} />
          )}
          {secondaryAction && (
            <Button label={secondaryAction.label} onPress={secondaryAction.onPress} variant={secondaryAction.variant ?? 'ghost'} />
          )}
        </View>
      )}
    </View>
  );
}

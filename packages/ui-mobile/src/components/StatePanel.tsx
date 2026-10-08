import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../theme';
import { Button, type ButtonProps } from './Button';
import { LinkButton } from './LinkButton';
import { MarkGlyph, type MarkGlyphName } from './brand/MarkGlyph';

export interface StatePanelAction {
  label: string;
  onPress: ButtonProps['onPress'];
  variant?: ButtonProps['variant'];
}

export type StatePanelTone = 'default' | 'onStage';

export interface StatePanelProps {
  glyph?: MarkGlyphName;
  icon?: string;
  title: string;
  body?: string;
  primaryAction?: StatePanelAction;
  secondaryAction?: StatePanelAction;
  accessibilityRole?: 'alert' | 'none';
  tone?: StatePanelTone;
  animateGlyph?: boolean;
  testID?: string;
}

let iconDeprecationWarned = false;

function warnIconDeprecated(): void {
  if (!__DEV__ || iconDeprecationWarned) return;
  iconDeprecationWarned = true;
  console.warn('StatePanel: `icon` está obsoleto; usa `glyph` (MarkGlyph).');
}

export function StatePanel({
  glyph,
  icon,
  title,
  body,
  primaryAction,
  secondaryAction,
  accessibilityRole = 'none',
  tone = 'default',
  animateGlyph = true,
  testID,
}: StatePanelProps): React.JSX.Element {
  const theme = useTheme();
  const onStage = tone === 'onStage';
  const titleColor = onStage ? theme.colors.onStage : theme.colors.text;
  const bodyColor = onStage ? theme.colors.onStageMuted : theme.colors.textMuted;

  if (icon && !glyph) warnIconDeprecated();

  return (
    <View
      testID={testID}
      accessibilityRole={accessibilityRole === 'alert' ? 'alert' : undefined}
      style={{ alignItems: 'center', padding: theme.spacing.xl, gap: theme.spacing.sm }}
    >
      {glyph && (
        <View style={{ marginBottom: theme.spacing.sm }}>
          <MarkGlyph glyph={glyph} size={72} animate={animateGlyph} />
        </View>
      )}
      {!glyph && icon && (
        <Text
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={{ fontSize: 40 }}
        >
          {icon}
        </Text>
      )}
      <Text
        accessibilityRole="header"
        style={{ ...theme.typography.title, color: titleColor, textAlign: 'center' }}
      >
        {title}
      </Text>
      {body && (
        <Text style={{ ...theme.typography.body, color: bodyColor, textAlign: 'center' }}>
          {body}
        </Text>
      )}
      {(primaryAction || secondaryAction) && (
        <View
          style={{
            width: '100%',
            alignItems: 'stretch',
            gap: theme.spacing.sm,
            marginTop: theme.spacing.md,
          }}
        >
          {primaryAction && (
            <Button
              label={primaryAction.label}
              onPress={primaryAction.onPress}
              variant={primaryAction.variant ?? 'primary'}
              size="lg"
            />
          )}
          {secondaryAction && secondaryAction.variant !== undefined && (
            <Button
              label={secondaryAction.label}
              onPress={secondaryAction.onPress}
              variant={secondaryAction.variant}
            />
          )}
          {secondaryAction && secondaryAction.variant === undefined && (
            <View style={{ alignItems: 'center' }}>
              <LinkButton
                label={secondaryAction.label}
                onPress={secondaryAction.onPress}
                style={{ alignSelf: 'center' }}
              />
            </View>
          )}
        </View>
      )}
    </View>
  );
}

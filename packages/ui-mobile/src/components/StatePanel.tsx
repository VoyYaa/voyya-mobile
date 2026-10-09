import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../theme';
import type { ColorTokens } from '../palette';
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
  tertiaryAction?: StatePanelAction;
  accessibilityRole?: 'alert' | 'none';
  tone?: StatePanelTone;
  animateGlyph?: boolean;
  testID?: string;
}

const OFFLINE_ON_STAGE = '#7DB8D8';

function stageGlyphColor(glyph: MarkGlyphName, colors: ColorTokens): string {
  const byGlyph: Record<MarkGlyphName, string> = {
    empty: colors.onStage,
    clock: colors.brand,
    error: colors.danger,
    offline: OFFLINE_ON_STAGE,
    success: colors.success,
    pin: colors.brand,
    search: colors.brand,
  };
  return byGlyph[glyph];
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
  tertiaryAction,
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
          <MarkGlyph
            glyph={glyph}
            size={72}
            animate={animateGlyph}
            color={onStage ? stageGlyphColor(glyph, theme.colors) : undefined}
          />
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
      {(primaryAction || secondaryAction || tertiaryAction) && (
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
          {secondaryAction && (secondaryAction.variant !== undefined || onStage) && (
            <Button
              label={secondaryAction.label}
              onPress={secondaryAction.onPress}
              variant={secondaryAction.variant ?? 'ghostOnStage'}
            />
          )}
          {secondaryAction && secondaryAction.variant === undefined && !onStage && (
            <View style={{ alignItems: 'center' }}>
              <LinkButton
                label={secondaryAction.label}
                onPress={secondaryAction.onPress}
                style={{ alignSelf: 'center' }}
              />
            </View>
          )}
          {tertiaryAction && onStage && (
            <Button
              label={tertiaryAction.label}
              onPress={tertiaryAction.onPress}
              variant={tertiaryAction.variant ?? 'ghostOnStage'}
              size="sm"
            />
          )}
          {tertiaryAction && !onStage && (
            <View style={{ alignItems: 'center' }}>
              <LinkButton
                label={tertiaryAction.label}
                onPress={tertiaryAction.onPress}
                style={{ alignSelf: 'center' }}
              />
            </View>
          )}
        </View>
      )}
    </View>
  );
}

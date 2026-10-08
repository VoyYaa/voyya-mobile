import React from 'react';
import { Text, View } from 'react-native';
import { BRAND_COLORS, Button, MarkGlyph, useTheme, type MarkGlyphName } from '@voyyaa/ui-mobile';

export interface StageStatePanelAction {
  label: string;
  onPress: () => void;
}

export interface StageStatePanelProps {
  glyph: MarkGlyphName;
  title: string;
  body?: string;
  primaryAction?: StageStatePanelAction;
  secondaryAction?: StageStatePanelAction;
  role?: 'alert';
  testID?: string;
}

const GLYPH_SIZE = 72;
const OFFLINE_ON_STAGE = '#7DB8D8';

const GLYPH_COLORS: Record<MarkGlyphName, string> = {
  empty: BRAND_COLORS.crema,
  clock: BRAND_COLORS.amber,
  error: BRAND_COLORS.danger,
  offline: OFFLINE_ON_STAGE,
  success: BRAND_COLORS.go,
  pin: BRAND_COLORS.amber,
  search: BRAND_COLORS.amber,
};

export function StageStatePanel({
  glyph,
  title,
  body,
  primaryAction,
  secondaryAction,
  role,
  testID,
}: StageStatePanelProps): React.JSX.Element {
  const theme = useTheme();

  return (
    <View
      testID={testID}
      accessibilityRole={role}
      style={{ alignItems: 'center', padding: theme.spacing.xl, gap: theme.spacing.sm }}
    >
      <View style={{ marginBottom: theme.spacing.sm }}>
        <MarkGlyph glyph={glyph} size={GLYPH_SIZE} color={GLYPH_COLORS[glyph]} animate />
      </View>
      <Text
        accessibilityRole="header"
        style={{ ...theme.typography.title, color: theme.colors.onStage, textAlign: 'center' }}
      >
        {title}
      </Text>
      {body ? (
        <Text
          style={{
            ...theme.typography.body,
            color: theme.colors.onStageMuted,
            textAlign: 'center',
          }}
        >
          {body}
        </Text>
      ) : null}
      {(primaryAction || secondaryAction) && (
        <View style={{ alignSelf: 'stretch', gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
          {primaryAction && (
            <Button
              label={primaryAction.label}
              size="lg"
              onPress={primaryAction.onPress}
              testID="stage-panel-primary"
            />
          )}
          {secondaryAction && (
            <Button
              label={secondaryAction.label}
              variant="ghostOnStage"
              onPress={secondaryAction.onPress}
              testID="stage-panel-secondary"
            />
          )}
        </View>
      )}
    </View>
  );
}

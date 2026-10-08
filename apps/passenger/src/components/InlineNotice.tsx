import React from 'react';
import { Text, View } from 'react-native';
import { LinkButton, MarkGlyph, useTheme, type MarkGlyphName } from '@voyyaa/ui-mobile';

export type InlineNoticeTone = 'danger' | 'info' | 'brand';

export interface InlineNoticeProps {
  tone: InlineNoticeTone;
  glyph: MarkGlyphName;
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
  testID?: string;
}

const GLYPH_SIZE = 40;

export function InlineNotice({
  tone,
  glyph,
  title,
  body,
  actionLabel,
  onAction,
  testID,
}: InlineNoticeProps): React.JSX.Element {
  const theme = useTheme();
  const { colors } = theme;
  const palette = {
    danger: { bg: colors.dangerTint, ink: colors.dangerInk, glyph: colors.dangerInk },
    info: { bg: colors.infoTint, ink: colors.infoInk, glyph: colors.infoInk },
    brand: { bg: colors.brandTint, ink: colors.text, glyph: colors.brandInk },
  }[tone];

  return (
    <View
      testID={testID}
      accessibilityRole={tone === 'danger' ? 'alert' : undefined}
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: theme.spacing.md,
        backgroundColor: palette.bg,
        borderRadius: theme.radius.card,
        padding: theme.spacing.lg,
      }}
    >
      <MarkGlyph glyph={glyph} size={GLYPH_SIZE} color={palette.glyph} />
      <View style={{ flex: 1, gap: theme.spacing.xxs }}>
        <Text style={{ ...theme.typography.bodyStrong, color: palette.ink }}>{title}</Text>
        {body ? (
          <Text style={{ ...theme.typography.small, color: palette.ink }}>{body}</Text>
        ) : null}
        {actionLabel && onAction ? (
          <LinkButton
            label={actionLabel}
            onPress={onAction}
            style={{ marginLeft: -theme.spacing.xs }}
          />
        ) : null}
      </View>
    </View>
  );
}

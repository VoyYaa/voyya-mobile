import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useFocusState } from '../hooks/useFocusState';
import { useTheme } from '../theme';
import { uiCopy } from '../copy';
import {
  resolveBannerA11y,
  type StatusBannerIcon,
  type StatusBannerRole,
  type StatusBannerTone,
} from '../utils/status-banner';
import { MarkGlyph, type MarkGlyphName } from './brand/MarkGlyph';
import { LinkButton } from './LinkButton';

export interface StatusBannerProps {
  tone: StatusBannerTone;
  icon: StatusBannerIcon;
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss?: () => void;
  dismissLabel?: string;
  role?: StatusBannerRole;
  testID?: string;
}

const ICON_SIZE = 24;

const GLYPH_BY_ICON: Record<StatusBannerIcon, MarkGlyphName> = {
  pin: 'pin',
  clock: 'clock',
  alert: 'error',
  bell: 'bell',
};

export function StatusBanner({
  tone,
  icon,
  title,
  body,
  actionLabel,
  onAction,
  onDismiss,
  dismissLabel = uiCopy.close,
  role,
  testID,
}: StatusBannerProps): React.JSX.Element {
  const { colors, spacing, radius, typography, touch } = useTheme();
  const { focused, onFocus, onBlur } = useFocusState();
  const a11y = resolveBannerA11y(tone, role);
  const palette = {
    info: { background: colors.infoTint, ink: colors.infoInk },
    warning: { background: colors.warningTint, ink: colors.warningInk },
    danger: { background: colors.dangerTint, ink: colors.dangerInk },
  }[tone];
  const showAction = Boolean(actionLabel && onAction);

  return (
    <View
      testID={testID}
      accessibilityRole={a11y.role === 'alert' ? 'alert' : undefined}
      accessibilityLiveRegion={a11y.liveRegion}
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.md,
        borderRadius: radius.card,
        backgroundColor: palette.background,
        paddingVertical: spacing.md,
        paddingLeft: spacing.lg,
        paddingRight: onDismiss ? spacing.xs : spacing.lg,
      }}
    >
      <View style={{ paddingTop: 2 }}>
        <MarkGlyph glyph={GLYPH_BY_ICON[icon]} size={ICON_SIZE} color={palette.ink} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ ...typography.bodyStrong, color: palette.ink }}>{title}</Text>
        {body && (
          <Text style={{ ...typography.small, color: colors.textMuted, marginTop: spacing.xxs }}>
            {body}
          </Text>
        )}
        {showAction && actionLabel && onAction && (
          <LinkButton label={actionLabel} onPress={onAction} testID={testID && `${testID}-action`} />
        )}
      </View>
      {onDismiss && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={dismissLabel}
          onPress={onDismiss}
          onFocus={onFocus}
          onBlur={onBlur}
          style={{
            width: touch.min,
            height: touch.min,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: radius.pill,
            borderWidth: 2,
            borderColor: focused ? colors.focusRing : 'transparent',
          }}
        >
          <Text style={{ ...typography.title, color: palette.ink }}>×</Text>
        </Pressable>
      )}
    </View>
  );
}

import React from 'react';
import { Pressable, Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import {
  BrandSpinner,
  Button,
  Card,
  MarkGlyph,
  Reveal,
  useFocusState,
  useTheme,
} from '@voyyaa/ui-mobile';
import { notificationsCopy } from '../copy/notifications-copy';
import { bannerPresentation, type NotificationsBannerVariant } from '../lib/notifications-banner';

export interface NotificationsBannerProps {
  variant: NotificationsBannerVariant;
  onAction?: () => void;
  onDismiss?: () => void;
  onHeightChange?: (height: number) => void;
  testID?: string;
}

const GLYPH_SIZE = 28;
const SPINNER_SIZE = 20;
const CLOSE_ICON_SIZE = 16;

function CloseButton({ onPress }: { onPress: () => void }): React.JSX.Element {
  const theme = useTheme();
  const { focused, onFocus, onBlur } = useFocusState();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={notificationsCopy.banner.dismiss}
      onPress={onPress}
      onFocus={onFocus}
      onBlur={onBlur}
      testID="notifications-banner-dismiss"
      style={({ pressed }) => ({
        width: theme.touch.min,
        height: theme.touch.min,
        marginTop: -theme.spacing.sm,
        marginRight: -theme.spacing.sm,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.radius.chip,
        borderWidth: 2,
        borderColor: focused ? theme.colors.focusRing : 'transparent',
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Svg width={CLOSE_ICON_SIZE} height={CLOSE_ICON_SIZE} viewBox="0 0 16 16">
        <Path
          d="M3 3 L13 13 M13 3 L3 13"
          stroke={theme.colors.onStageMuted}
          strokeWidth={2.5}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
    </Pressable>
  );
}

export function NotificationsBanner({
  variant,
  onAction,
  onDismiss,
  onHeightChange,
  testID = 'notifications-banner',
}: NotificationsBannerProps): React.JSX.Element {
  const theme = useTheme();
  const view = bannerPresentation(variant);

  const handleLayout = (event: LayoutChangeEvent): void => {
    onHeightChange?.(event.nativeEvent.layout.height);
  };

  return (
    <View onLayout={handleLayout} style={{ alignSelf: 'stretch' }}>
      <Reveal>
        <Card tone="stage" style={{ padding: theme.spacing.md }} testID={testID}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.md }}>
            <View
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={{
                width: GLYPH_SIZE,
                height: GLYPH_SIZE,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {view.glyph === 'spinner' ? (
                <BrandSpinner size={SPINNER_SIZE} color={theme.colors.brand} />
              ) : (
                <MarkGlyph
                  glyph={view.glyph}
                  size={GLYPH_SIZE}
                  color={view.glyph === 'bell' ? theme.colors.brand : theme.colors.onStageMuted}
                />
              )}
            </View>
            <View style={{ flex: 1, gap: theme.spacing.sm }}>
              <View accessible accessibilityLabel={view.accessibilityLabel} style={{ gap: 2 }}>
                <Text
                  testID={`${testID}-title`}
                  style={{ ...theme.typography.smallStrong, color: theme.colors.onStage }}
                >
                  {view.title}
                </Text>
                {view.body !== null && (
                  <Text style={{ ...theme.typography.small, color: theme.colors.onStageMuted }}>
                    {view.body}
                  </Text>
                )}
              </View>
              {view.actionLabel !== null && onAction !== undefined && (
                <Button
                  label={view.actionLabel}
                  size="sm"
                  variant="ghostOnStage"
                  accessibilityHint={view.actionHint ?? undefined}
                  onPress={onAction}
                  style={{ alignSelf: 'flex-start' }}
                  testID={`${testID}-action`}
                />
              )}
            </View>
            {view.dismissible && onDismiss !== undefined && <CloseButton onPress={onDismiss} />}
          </View>
        </Card>
      </Reveal>
    </View>
  );
}

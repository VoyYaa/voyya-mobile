import React, { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Pressable, Text, View } from 'react-native';
import { useTheme } from '../theme';
import { USE_NATIVE_DRIVER, motion } from '../tokens';
import { uiCopy } from '../copy';
import { useFocusState } from '../hooks/useFocusState';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { BrandSpinner } from './brand/BrandSpinner';
import { MarkGlyph } from './brand/MarkGlyph';

export type OfflineBannerState = 'offline' | 'reconnecting' | 'restored';

export interface OfflineBannerProps {
  state: OfflineBannerState;
  lastUpdatedLabel?: string;
  onRetryNow?: () => void;
  topInset?: number;
  testID?: string;
}

const COPY: Record<OfflineBannerState, string> = {
  offline: uiCopy.offlineRetrying,
  reconnecting: uiCopy.offlineRetrying,
  restored: uiCopy.connectionRestored,
};

const ENTER_TRAVEL_DP = 16;

export function OfflineBanner({
  state,
  lastUpdatedLabel,
  onRetryNow,
  topInset = 0,
  testID,
}: OfflineBannerProps): React.JSX.Element {
  const theme = useTheme();
  const reduced = useReducedMotion();
  const { focused, onFocus, onBlur } = useFocusState();
  const previousState = useRef<OfflineBannerState | null>(null);
  const entrance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (previousState.current !== state) {
      AccessibilityInfo.announceForAccessibility(COPY[state]);
      previousState.current = state;
    }
  }, [state]);

  useEffect(() => {
    const animation = Animated.timing(entrance, {
      toValue: 1,
      duration: reduced ? motion.reducedFadeMs : motion.dur.base,
      easing: motion.ease.out,
      useNativeDriver: USE_NATIVE_DRIVER,
    });
    animation.start();
    return () => animation.stop();
  }, [entrance, reduced]);

  const { colors } = theme;
  const isRestored = state === 'restored';
  const background = isRestored ? colors.successTint : colors.infoTint;
  const ink = isRestored ? colors.successInk : colors.infoInk;
  const translateY = reduced
    ? 0
    : entrance.interpolate({ inputRange: [0, 1], outputRange: [-ENTER_TRAVEL_DP, 0] });

  return (
    <Animated.View
      testID={testID}
      accessibilityLiveRegion="polite"
      style={{
        opacity: entrance,
        transform: [{ translateY }],
        backgroundColor: background,
        paddingTop: topInset + theme.spacing.sm,
        paddingBottom: theme.spacing.sm,
        paddingHorizontal: theme.spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
      }}
    >
      {state === 'reconnecting' ? (
        <BrandSpinner size={16} color={ink} />
      ) : (
        <MarkGlyph glyph={isRestored ? 'success' : 'offline'} size={20} />
      )}
      <View style={{ flex: 1 }}>
        <Text style={{ ...theme.typography.smallStrong, color: ink }}>{COPY[state]}</Text>
        {!isRestored && lastUpdatedLabel && (
          <Text style={{ ...theme.typography.small, color: colors.textMuted }}>
            {uiCopy.updatedAgo} {lastUpdatedLabel}
          </Text>
        )}
      </View>
      {!isRestored && onRetryNow && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={uiCopy.retryNow}
          onPress={onRetryNow}
          onFocus={onFocus}
          onBlur={onBlur}
          style={{
            minHeight: theme.touch.min,
            minWidth: theme.touch.min,
            paddingHorizontal: theme.spacing.md,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: theme.radius.button,
            borderWidth: 2,
            borderColor: focused ? colors.focusRing : ink,
          }}
        >
          <Text style={{ ...theme.typography.smallStrong, color: ink }}>{uiCopy.retryNow}</Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

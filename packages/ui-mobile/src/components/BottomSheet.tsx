import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Modal,
  PanResponder,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useTheme } from '../theme';
import { USE_NATIVE_DRIVER, motion } from '../tokens';
import { uiCopy } from '../copy';
import { useReducedMotion } from '../hooks/useReducedMotion';

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  testID?: string;
}

const VELO_MAX_OPACITY = 0.45;
const DRAG_CLOSE_DISTANCE_DP = 80;
const DRAG_START_DISTANCE_DP = 6;
const HANDLE_WIDTH = 40;
const HANDLE_HEIGHT = 4;

export function BottomSheet({
  visible,
  onClose,
  title,
  children,
  testID,
}: BottomSheetProps): React.JSX.Element {
  const theme = useTheme();
  const reduced = useReducedMotion();
  const { height: windowHeight } = useWindowDimensions();
  const announcedTitle = useRef<string | undefined>(undefined);
  const [rendered, setRendered] = useState(visible);
  const enter = useRef(new Animated.Value(0)).current;
  const drag = useRef(new Animated.Value(0)).current;
  const still = useRef(new Animated.Value(0)).current;

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (visible && title && announcedTitle.current !== title) {
      AccessibilityInfo.announceForAccessibility(title);
      announcedTitle.current = title;
    }
    if (!visible) {
      announcedTitle.current = undefined;
    }
  }, [visible, title]);

  useEffect(() => {
    if (visible) {
      setRendered(true);
      drag.setValue(0);
      const opening = Animated.timing(enter, {
        toValue: 1,
        duration: reduced ? motion.reducedFadeMs : motion.dur.enter,
        easing: motion.ease.out,
        useNativeDriver: USE_NATIVE_DRIVER,
      });
      opening.start();
      return () => opening.stop();
    }
    const closing = Animated.timing(enter, {
      toValue: 0,
      duration: reduced ? motion.reducedFadeMs : motion.dur.base,
      easing: motion.ease.out,
      useNativeDriver: USE_NATIVE_DRIVER,
    });
    closing.start(({ finished }) => {
      if (finished) setRendered(false);
    });
    return () => closing.stop();
  }, [visible, reduced, enter, drag]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          gesture.dy > DRAG_START_DISTANCE_DP && Math.abs(gesture.dy) > Math.abs(gesture.dx),
        onPanResponderMove: (_, gesture) => {
          if (gesture.dy > 0) drag.setValue(gesture.dy);
        },
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dy > DRAG_CLOSE_DISTANCE_DP) {
            onCloseRef.current();
            return;
          }
          Animated.timing(drag, {
            toValue: 0,
            duration: motion.dur.base,
            easing: motion.ease.out,
            useNativeDriver: USE_NATIVE_DRIVER,
          }).start();
        },
        onPanResponderTerminate: () => {
          Animated.timing(drag, {
            toValue: 0,
            duration: motion.dur.base,
            easing: motion.ease.out,
            useNativeDriver: USE_NATIVE_DRIVER,
          }).start();
        },
      }),
    [drag],
  );

  const slide = reduced
    ? still
    : enter.interpolate({ inputRange: [0, 1], outputRange: [windowHeight, 0] });
  const veloOpacity = enter.interpolate({ inputRange: [0, 1], outputRange: [0, VELO_MAX_OPACITY] });

  return (
    <Modal
      visible={rendered}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
      testID={testID}
    >
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: theme.colors.stage,
            opacity: veloOpacity,
          }}
        >
          <Pressable
            accessibilityLabel={uiCopy.close}
            accessibilityRole="button"
            onPress={onClose}
            style={{ flex: 1 }}
          />
        </Animated.View>
        <Animated.View
          accessibilityViewIsModal
          style={{
            backgroundColor: theme.colors.surfaceRaised,
            borderTopLeftRadius: theme.radius.sheet,
            borderTopRightRadius: theme.radius.sheet,
            paddingHorizontal: theme.spacing.xl,
            paddingBottom: theme.spacing.xxl,
            opacity: reduced ? enter : 1,
            transform: [{ translateY: Animated.add(slide, drag) }],
            ...theme.shadow.lg,
          }}
        >
          <View
            {...panResponder.panHandlers}
            style={{ paddingTop: theme.spacing.md, paddingBottom: theme.spacing.sm }}
          >
            <View
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={{
                alignSelf: 'center',
                width: HANDLE_WIDTH,
                height: HANDLE_HEIGHT,
                borderRadius: HANDLE_HEIGHT / 2,
                backgroundColor: theme.colors.borderStrong,
                marginBottom: theme.spacing.sm,
              }}
            />
            {title && (
              <Text
                accessibilityRole="header"
                style={{ ...theme.typography.title, color: theme.colors.text }}
              >
                {title}
              </Text>
            )}
          </View>
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

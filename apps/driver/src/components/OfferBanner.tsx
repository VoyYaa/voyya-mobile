import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  type LayoutChangeEvent,
  Platform,
  Pressable,
  Text,
  Vibration,
  View,
} from 'react-native';
import type { AssignmentNotification } from '@voyyaa/shared';
import {
  BrandMark,
  PriceTag,
  RadarPulse,
  motion,
  useCountdown,
  useReducedMotion,
  useTheme,
} from '@voyyaa/ui-mobile';
import { COUNTDOWN_WARN_THRESHOLD_SEC } from '../constants/parameters';
import { driverCopy } from '../copy/driver-copy';
import { isOfferUrgent, offerRailRatio } from '../offers/offer-rail';

export interface OfferBannerProps {
  offer: AssignmentNotification | null;
  onPress: (assignmentId: number) => void;
}

const BANNER_MIN_HEIGHT = 92;
const EXIT_MS = 200;
const RAIL_HEIGHT = 3;
const MARK_BOX = 56;
const MARK_SIZE = 40;
const RING_PERIOD_MS = 1600;
const VIBRATION_PATTERN = [0, 220, 120, 220];
const NATIVE = Platform.OS !== 'web';
const SLOT_ANIMATION_NATIVE = false;

export function OfferBanner({ offer, onPress }: OfferBannerProps): React.JSX.Element | null {
  const theme = useTheme();
  const reduced = useReducedMotion();
  const lastOffer = useRef<AssignmentNotification | null>(offer);
  if (offer) lastOffer.current = offer;
  const shown = offer ?? lastOffer.current;

  const remainingSec = useCountdown(shown?.expires_at ?? null);
  const live = offer !== null && remainingSec > 0;
  const [rendered, setRendered] = useState(live);
  const [railWidth, setRailWidth] = useState(0);
  const [contentHeight, setContentHeight] = useState<number | null>(null);

  const enter = useRef(new Animated.Value(live ? 1 : 0)).current;
  const rail = useRef(new Animated.Value(1)).current;
  const railInitialised = useRef(false);

  useEffect(() => {
    if (live) {
      setRendered(true);
      const animation = Animated.timing(enter, {
        toValue: 1,
        duration: reduced ? motion.reducedFadeMs : motion.dur.enter,
        easing: motion.ease.out,
        useNativeDriver: SLOT_ANIMATION_NATIVE,
      });
      animation.start();
      return () => animation.stop();
    }
    const animation = Animated.timing(enter, {
      toValue: 0,
      duration: reduced ? motion.reducedFadeMs : EXIT_MS,
      easing: motion.ease.out,
      useNativeDriver: SLOT_ANIMATION_NATIVE,
    });
    animation.start(({ finished }) => {
      if (finished) setRendered(false);
    });
    return () => animation.stop();
  }, [live, reduced, enter]);

  const offerId = offer?.assignment_id ?? null;
  useEffect(() => {
    if (offerId === null || !offer) return;
    railInitialised.current = false;
    if (NATIVE) Vibration.vibrate(VIBRATION_PATTERN);
    AccessibilityInfo.announceForAccessibility(
      driverCopy.offer.bannerAnnouncement(offer.distance_to_origin_m, offer.seconds_to_respond),
    );
  }, [offerId]);

  const total = shown?.seconds_to_respond ?? 0;
  useEffect(() => {
    if (!shown) return;
    if (reduced || !railInitialised.current) {
      rail.setValue(offerRailRatio(remainingSec, total));
      railInitialised.current = true;
      return;
    }
    const animation = Animated.timing(rail, {
      toValue: offerRailRatio(remainingSec - 1, total),
      duration: motion.dur.tick,
      easing: motion.ease.linear,
      useNativeDriver: NATIVE,
    });
    animation.start();
    return () => animation.stop();
  }, [remainingSec, total, reduced, rail, shown]);

  if (!rendered || !shown) return null;

  const urgent = isOfferUrgent(remainingSec, COUNTDOWN_WARN_THRESHOLD_SEC);
  const slotHeight =
    contentHeight === null
      ? undefined
      : reduced
        ? contentHeight
        : enter.interpolate({ inputRange: [0, 1], outputRange: [0, contentHeight] });
  const railTranslate = rail.interpolate({
    inputRange: [0, 1],
    outputRange: [-railWidth, 0],
  });
  const handleRailLayout = (event: LayoutChangeEvent): void =>
    setRailWidth(event.nativeEvent.layout.width);
  const handleContentLayout = (event: LayoutChangeEvent): void =>
    setContentHeight(event.nativeEvent.layout.height);

  return (
    <Animated.View
      testID="offer-banner-slot"
      style={{
        pointerEvents: live ? 'auto' : 'none',
        overflow: 'hidden',
        height: slotHeight,
        opacity: enter,
      }}
    >
      <View
        onLayout={handleContentLayout}
        style={{
          marginHorizontal: theme.spacing.gutter,
          paddingVertical: theme.spacing.sm,
        }}
      >
        <Pressable
          testID="offer-banner"
          accessibilityRole="button"
          accessibilityLabel={`${driverCopy.offer.title}. ${driverCopy.offer.banner(shown.distance_to_origin_m, shown.dropoff_neighborhood)}. ${remainingSec} segundos para responder.`}
          onPress={() => onPress(shown.assignment_id)}
          style={{
            minHeight: BANNER_MIN_HEIGHT,
            backgroundColor: theme.colors.stage,
            borderRadius: theme.radius.card,
            borderWidth: 1.5,
            borderColor: theme.colors.brand,
            overflow: 'hidden',
            justifyContent: 'space-between',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: theme.spacing.md,
              paddingHorizontal: theme.spacing.lg,
              paddingTop: theme.spacing.md,
              paddingBottom: theme.spacing.sm,
            }}
          >
            <View
              style={{
                width: MARK_BOX,
                height: MARK_BOX,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <View style={{ position: 'absolute' }}>
                <RadarPulse
                  size={MARK_BOX}
                  rings={2}
                  periodMs={RING_PERIOD_MS}
                  color={theme.colors.success}
                />
              </View>
              <BrandMark role="driver" size={MARK_SIZE} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ ...theme.typography.subtitle, color: theme.colors.onStage }}>
                {driverCopy.offer.title}
              </Text>
              <Text
                numberOfLines={2}
                style={{ ...theme.typography.small, color: theme.colors.onStageMuted }}
              >
                {driverCopy.offer.banner(shown.distance_to_origin_m, shown.dropoff_neighborhood)}
              </Text>
            </View>
            <PriceTag amountCOP={shown.total_fare} size="md" color={theme.colors.onStage} />
          </View>
          <View
            testID="offer-banner-rail"
            onLayout={handleRailLayout}
            style={{
              height: RAIL_HEIGHT,
              backgroundColor: theme.colors.stageLine,
              overflow: 'hidden',
            }}
          >
            <Animated.View
              style={{
                height: RAIL_HEIGHT,
                width: '100%',
                backgroundColor: urgent ? theme.colors.danger : theme.colors.brand,
                transform: [{ translateX: railTranslate }],
              }}
            />
          </View>
        </Pressable>
      </View>
    </Animated.View>
  );
}

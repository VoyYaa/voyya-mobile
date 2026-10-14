import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Linking } from 'react-native';
import { activatePushNotifications, useNetworkStatus, usePushStore } from '@voyyaa/app-runtime';
import {
  bannerPresentation,
  resolveBannerVariant,
  shouldAnnounceBanner,
  type NotificationsBannerVariant,
} from '../lib/notifications-banner';
import {
  NOTIFICATIONS_PROMPT_SETTLE_MS,
  isPromptEligible,
} from '../lib/notifications-prompt-policy';
import type { NotificationsPromptState } from '../lib/notifications-prompt-store';
import { notificationsPromptStore } from '../lib/notifications-prompt-runtime';
import type { TripPhase } from '../lib/trip-phase';
import { useNotificationsUiStore } from '../state/useNotificationsUiStore';

export interface PassengerNotificationsArgs {
  tripRequestId: number | null;
  phase: TripPhase;
}

export interface NotificationsBannerModel {
  variant: NotificationsBannerVariant;
  onAction: (() => void) | undefined;
  onDismiss: (() => void) | undefined;
}

export interface NotificationsSheetModel {
  visible: boolean;
  loading: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export interface PassengerNotifications {
  banner: NotificationsBannerModel | null;
  sheet: NotificationsSheetModel;
}

export function usePassengerNotifications({
  tripRequestId,
  phase,
}: PassengerNotificationsArgs): PassengerNotifications {
  const permission = usePushStore((s) => s.permission);
  const registration = usePushStore((s) => s.registration);
  const activating = usePushStore((s) => s.activating);
  const network = useNetworkStatus();
  const dismissedTripId = useNotificationsUiStore((s) => s.dismissedTripId);
  const confirmed = useNotificationsUiStore((s) => s.confirmed);
  const decisionCount = useNotificationsUiStore((s) => s.decisionCount);
  const dismissBanner = useNotificationsUiStore((s) => s.dismissBanner);
  const registerDecision = useNotificationsUiStore((s) => s.registerDecision);

  const [promptState, setPromptState] = useState<NotificationsPromptState | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const refreshPromptState = useCallback((): Promise<void> => {
    return notificationsPromptStore.read().then(setPromptState);
  }, []);

  useEffect(() => {
    void refreshPromptState();
  }, [refreshPromptState]);

  const eligible =
    promptState !== null &&
    tripRequestId !== null &&
    isPromptEligible({
      phase,
      tripRequestId,
      permission,
      online: network === 'online',
      offeredTripId: promptState.offeredTripId,
      declineCount: promptState.declineCount,
    });

  useEffect(() => {
    if (!eligible || sheetOpen || tripRequestId === null) return;
    const timer = setTimeout(() => {
      setSheetOpen(true);
      void notificationsPromptStore.recordOffered(tripRequestId).then(refreshPromptState);
    }, NOTIFICATIONS_PROMPT_SETTLE_MS);
    return () => clearTimeout(timer);
  }, [eligible, sheetOpen, tripRequestId, refreshPromptState]);

  useEffect(() => {
    const stillAsking = permission === 'undetermined' || activating;
    if (sheetOpen && (phase !== 'searching' || !stillAsking)) setSheetOpen(false);
  }, [sheetOpen, phase, permission, activating]);

  const activate = useCallback((): void => {
    registerDecision();
    void activatePushNotifications();
  }, [registerDecision]);

  const onAccept = useCallback((): void => {
    registerDecision();
    void activatePushNotifications().finally(() => setSheetOpen(false));
  }, [registerDecision]);

  const onDecline = useCallback((): void => {
    if (activating) return;
    setSheetOpen(false);
    registerDecision();
    void notificationsPromptStore.recordDeclined().then(refreshPromptState);
  }, [activating, registerDecision, refreshPromptState]);

  const variant = resolveBannerVariant({
    phase,
    dismissed: tripRequestId !== null && dismissedTripId === tripRequestId,
    permission,
    registration,
    activating,
    confirmed,
    promptActive: sheetOpen || eligible,
  });

  const announced = useRef<{ variant: NotificationsBannerVariant | null; decisions: number }>({
    variant: null,
    decisions: decisionCount,
  });
  useEffect(() => {
    const decisionPending = decisionCount !== announced.current.decisions;
    if (
      variant !== null &&
      shouldAnnounceBanner({ previous: announced.current.variant, next: variant, decisionPending })
    ) {
      AccessibilityInfo.announceForAccessibility(bannerPresentation(variant).accessibilityLabel);
    }
    announced.current.variant = variant;
    if (decisionPending && variant !== null) announced.current.decisions = decisionCount;
  }, [variant, decisionCount]);

  const openSettings = useCallback((): void => {
    void Linking.openSettings();
  }, []);

  const dismiss = useCallback((): void => {
    if (tripRequestId !== null) dismissBanner(tripRequestId);
  }, [tripRequestId, dismissBanner]);

  const banner: NotificationsBannerModel | null =
    variant === null
      ? null
      : {
          variant,
          onAction:
            variant === 'blocked'
              ? openSettings
              : bannerHasActivate(variant)
                ? activate
                : undefined,
          onDismiss: bannerPresentation(variant).dismissible ? dismiss : undefined,
        };

  return {
    banner,
    sheet: { visible: sheetOpen, loading: activating, onAccept, onDecline },
  };
}

function bannerHasActivate(variant: NotificationsBannerVariant): boolean {
  return variant === 'askable' || variant === 'failed';
}

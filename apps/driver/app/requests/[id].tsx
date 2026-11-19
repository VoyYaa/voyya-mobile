import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  type LayoutChangeEvent,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BrandLoader,
  CountdownRing,
  type CountdownRingStatus,
  EmptyState,
  ErrorState,
  OfflineState,
  PointRoute,
  PriceTag,
  ScreenHeader,
  Stage,
  Toast,
  type ToastTone,
  Button,
  useCountdown,
  useTheme,
} from '@voyyaa/ui-mobile';
import { isNetworkError } from '@voyyaa/app-runtime';
import { ActionButtonPair } from '../../src/components/ActionButtonPair';
import { useAcceptAssignment } from '../../src/hooks/useAcceptAssignment';
import { useRejectAssignment } from '../../src/hooks/useRejectAssignment';
import { useNearbyOffers } from '../../src/hooks/useNearbyOffers';
import { useConsumedBackPress } from '../../src/hooks/useConsumedBackPress';
import { COUNTDOWN_WARN_THRESHOLD_SEC } from '../../src/constants/parameters';
import { requestStageLayout } from '../../src/offers/request-stage-layout';
import { driverCopy } from '../../src/copy/driver-copy';

type UiStatus =
  | 'counting'
  | 'accepting'
  | 'rejecting'
  | 'accepted'
  | 'rejected'
  | 'expired'
  | 'taken_by_other'
  | 'offline_response'
  | 'generic_error';

const NO_DECISION_STATES: readonly UiStatus[] = [
  'accepting',
  'rejecting',
  'accepted',
  'rejected',
  'expired',
  'taken_by_other',
];

const RING_STATUS_BY_UI: Record<UiStatus, CountdownRingStatus> = {
  counting: 'counting',
  accepting: 'frozen',
  rejecting: 'frozen',
  accepted: 'success',
  rejected: 'frozen',
  expired: 'expired',
  taken_by_other: 'frozen',
  offline_response: 'frozen',
  generic_error: 'frozen',
};

const HEADER_HEIGHT_ESTIMATE = 56;
const EYEBROW_HEIGHT_ESTIMATE = 20;
const FARE_BLOCK_HEIGHT_ESTIMATE = 80;
const ACTION_BAR_TOAST_OFFSET = 96;
const NOTICE_DURATION_MS = 2200;

interface ToastSpec {
  message: string;
  tone: ToastTone;
  durationMs: number;
}

export default function RequestDetailScreen(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const params = useLocalSearchParams<{ id: string }>();
  const assignmentId = params.id ? Number(params.id) : null;

  const offers = useNearbyOffers(true);
  const notification = assignmentId
    ? (offers.data?.find((n) => n.assignment_id === assignmentId) ?? null)
    : null;

  const [uiStatus, setUiStatus] = useState<UiStatus>('counting');
  const [lastAction, setLastAction] = useState<'accept' | 'reject' | null>(null);
  const [toastDismissedFor, setToastDismissedFor] = useState<UiStatus | null>(null);
  const [backNoticeVisible, setBackNoticeVisible] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(HEADER_HEIGHT_ESTIMATE);
  const [eyebrowHeight, setEyebrowHeight] = useState(EYEBROW_HEIGHT_ESTIMATE);
  const [fareBlockHeight, setFareBlockHeight] = useState(FARE_BLOCK_HEIGHT_ESTIMATE);
  const mountAnnounced = useRef(false);

  const acceptMutation = useAcceptAssignment(assignmentId);
  const rejectMutation = useRejectAssignment(assignmentId);

  const frozen = uiStatus !== 'counting';
  const remainingSec = useCountdown(notification?.expires_at ?? null, frozen);

  useEffect(() => {
    if (notification && !mountAnnounced.current) {
      mountAnnounced.current = true;
      AccessibilityInfo.announceForAccessibility(driverCopy.offer.mountAnnouncement(remainingSec));
    }
  }, [notification?.assignment_id]);

  const hideStatusToast = useCallback(() => setToastDismissedFor(uiStatus), [uiStatus]);
  const hideBackNotice = useCallback(() => setBackNoticeVisible(false), []);

  const announceBackNotice = useCallback(() => {
    setBackNoticeVisible(true);
    AccessibilityInfo.announceForAccessibility(driverCopy.offer.backNotice);
  }, []);
  useConsumedBackPress(uiStatus === 'counting', announceBackNotice);

  function goBackToList(delayMs: number): void {
    setTimeout(() => router.replace('/requests'), delayMs);
  }

  function handleAccept(): void {
    setLastAction('accept');
    setUiStatus('accepting');
    acceptMutation.mutate(undefined, {
      onSuccess: (result) => {
        if (result.result === 'accepted') {
          setUiStatus('accepted');
          setTimeout(
            () =>
              router.replace({
                pathname: '/trip/[id]',
                params: { id: String(result.trip_request_id) },
              }),
            800,
          );
        } else if (result.result === 'already_taken') {
          setUiStatus('taken_by_other');
          goBackToList(1200);
        } else {
          setUiStatus('expired');
          goBackToList(900);
        }
      },
      onError: (error) => {
        setUiStatus(isNetworkError(error) ? 'offline_response' : 'generic_error');
      },
    });
  }

  function handleReject(): void {
    setLastAction('reject');
    setUiStatus('rejecting');
    rejectMutation.mutate(undefined, {
      onSuccess: () => {
        setUiStatus('rejected');
        goBackToList(900);
      },
      onError: (error) => {
        setUiStatus(isNetworkError(error) ? 'offline_response' : 'generic_error');
      },
    });
  }

  function handleLocalExpiration(): void {
    setUiStatus((current) => {
      if (current !== 'counting') return current;
      goBackToList(900);
      return 'expired';
    });
  }

  function retry(): void {
    if (lastAction === 'accept') handleAccept();
    else if (lastAction === 'reject') handleReject();
  }

  const stageScreen = (children: React.ReactNode): React.JSX.Element => (
    <Stage style={{ flex: 1 }} topInset={insets.top}>
      <ScreenHeader
        title={driverCopy.offer.title}
        tone="stage"
        hideTitle
        onBack={() => router.back()}
      />
      {children}
    </Stage>
  );

  const lightScreen = (children: React.ReactNode): React.JSX.Element => (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg, paddingTop: insets.top }}>
      <ScreenHeader title={driverCopy.offer.title} onBack={() => router.back()} />
      {children}
    </View>
  );

  if (!assignmentId) {
    return lightScreen(
      <EmptyState
        glyph="empty"
        title={driverCopy.offer.notFoundTitle}
        body={driverCopy.offer.notFoundBody}
        primaryAction={{
          label: driverCopy.offer.backToList,
          onPress: () => router.replace('/requests'),
        }}
      />,
    );
  }

  if (!notification && offers.isLoading) {
    return stageScreen(<BrandLoader variant="screen" label={driverCopy.offer.loadingLabel} />);
  }

  if (!notification && offers.isError) {
    return lightScreen(
      isNetworkError(offers.error) ? (
        <OfflineState onRetry={() => offers.refetch()} />
      ) : (
        <ErrorState title={driverCopy.offer.loadError} onRetry={() => offers.refetch()} />
      ),
    );
  }

  if (!notification) {
    return lightScreen(
      <EmptyState
        glyph="empty"
        title={driverCopy.offer.notFoundTitle}
        body={driverCopy.offer.notFoundBody}
        primaryAction={{
          label: driverCopy.offer.backToList,
          onPress: () => router.replace('/requests'),
        }}
      />,
    );
  }

  const acceptedResult = acceptMutation.data?.result === 'accepted' ? acceptMutation.data : null;
  const toastByStatus: Partial<Record<UiStatus, ToastSpec>> = {
    accepted: {
      message: driverCopy.offer.accepted(acceptedResult?.passenger.name.trim() || null),
      tone: 'success',
      durationMs: 800,
    },
    rejected: { message: driverCopy.offer.rejected, tone: 'neutral', durationMs: 900 },
    expired: { message: driverCopy.offer.expired, tone: 'neutral', durationMs: 900 },
    taken_by_other: { message: driverCopy.offer.takenByOther, tone: 'neutral', durationMs: 1200 },
  };
  const toast = toastByStatus[uiStatus];
  const toastVisible = Boolean(toast) && toastDismissedFor !== uiStatus;

  const canDecide = !NO_DECISION_STATES.includes(uiStatus);
  const stageGap = theme.spacing.sm;
  const stageBottomPadding = theme.spacing.lg;
  const { stageMaxHeight, ringSize, compact } = requestStageLayout({
    windowHeight,
    topInset: insets.top,
    fixedHeight: headerHeight + eyebrowHeight + fareBlockHeight + stageGap * 2 + stageBottomPadding,
  });
  const measure =
    (setter: (height: number) => void) =>
    (event: LayoutChangeEvent): void =>
      setter(Math.ceil(event.nativeEvent.layout.height));
  const responseError = uiStatus === 'offline_response' || uiStatus === 'generic_error';

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <Stage
        testID="request-stage"
        topInset={insets.top}
        safeTop
        growWithContent
        style={{ maxHeight: stageMaxHeight, flexShrink: 0 }}
      >
        <View onLayout={measure(setHeaderHeight)}>
          <ScreenHeader
            title={driverCopy.offer.title}
            tone="stage"
            hideTitle
            onBack={uiStatus === 'counting' ? undefined : () => router.back()}
          />
        </View>
        <View
          style={{
            alignItems: 'center',
            paddingHorizontal: theme.spacing.gutter,
            paddingBottom: stageBottomPadding,
            gap: stageGap,
          }}
        >
          <View onLayout={measure(setEyebrowHeight)}>
            <Text style={{ ...theme.typography.eyebrow, color: theme.colors.onStageMuted }}>
              {`● ${driverCopy.offer.detailEyebrow}`}
            </Text>
          </View>
          <View
            testID="request-stage-body"
            style={
              compact
                ? { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.lg }
                : { alignItems: 'center', gap: stageGap }
            }
          >
            <CountdownRing
              testID="countdown-ring"
              durationSec={notification.seconds_to_respond}
              remainingSec={remainingSec}
              status={RING_STATUS_BY_UI[uiStatus]}
              warnThresholdSec={COUNTDOWN_WARN_THRESHOLD_SEC}
              onExpire={handleLocalExpiration}
              size={ringSize}
              tone="onStage"
              dimmed={uiStatus === 'taken_by_other'}
            />
            <View
              onLayout={measure(setFareBlockHeight)}
              style={{ alignItems: compact ? 'flex-start' : 'center', gap: stageGap }}
            >
              <PriceTag
                amountCOP={notification.total_fare}
                size="xl"
                color={theme.colors.onStage}
                testID="offer-fare"
              />
              <Text style={{ ...theme.typography.small, color: theme.colors.onStageMuted }}>
                {driverCopy.offer.fareCaption}
              </Text>
            </View>
          </View>
        </View>
      </Stage>

      <View style={{ flex: 1, minHeight: 0, zIndex: 1 }}>
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: theme.radius.sheet,
            backgroundColor: theme.colors.stage,
          }}
        />
        <View
          style={{
            flex: 1,
            minHeight: 0,
            backgroundColor: theme.colors.bg,
            borderTopLeftRadius: theme.radius.sheet,
            borderTopRightRadius: theme.radius.sheet,
          }}
        >
          <ScrollView
            contentContainerStyle={{
              padding: theme.spacing.gutter,
              paddingTop: theme.spacing.xl,
              gap: theme.spacing.lg,
            }}
          >
            <PointRoute
              origin={{
                label: driverCopy.offer.pickupLabel,
                value: driverCopy.offer.pickupValue(
                  notification.origin.address,
                  notification.distance_to_origin_m,
                ),
              }}
              destination={{
                label: driverCopy.offer.destinationLabel,
                value: notification.dropoff_neighborhood,
              }}
            />

            {responseError && (
              <View accessibilityRole="alert" style={{ gap: theme.spacing.sm }}>
                <Text style={{ ...theme.typography.bodyStrong, color: theme.colors.dangerInk }}>
                  {uiStatus === 'offline_response'
                    ? driverCopy.offer.offlineResponse
                    : driverCopy.offer.genericResponse}
                </Text>
                <Button
                  label={driverCopy.issues.retry}
                  variant="secondary"
                  onPress={retry}
                  testID="offer-retry"
                />
              </View>
            )}
          </ScrollView>

          <View
            style={{
              paddingHorizontal: theme.spacing.gutter,
              paddingTop: theme.spacing.md,
              paddingBottom: Math.max(insets.bottom, theme.spacing.lg),
            }}
          >
            <ActionButtonPair
              onAccept={handleAccept}
              onReject={handleReject}
              loading={
                uiStatus === 'accepting' ? 'accept' : uiStatus === 'rejecting' ? 'reject' : null
              }
              disabled={!canDecide}
            />
          </View>
        </View>
      </View>

      <Toast
        message={toast?.message ?? ''}
        tone={toast?.tone ?? 'neutral'}
        visible={toastVisible}
        durationMs={toast?.durationMs}
        bottomOffset={ACTION_BAR_TOAST_OFFSET}
        onHide={hideStatusToast}
      />
      <Toast
        testID="back-notice"
        message={driverCopy.offer.backNotice}
        tone="info"
        visible={backNoticeVisible}
        durationMs={NOTICE_DURATION_MS}
        bottomOffset={ACTION_BAR_TOAST_OFFSET}
        onHide={hideBackNotice}
      />
    </View>
  );
}

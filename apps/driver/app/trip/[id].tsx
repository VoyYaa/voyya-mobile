import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BrandLoader,
  Button,
  Card,
  Chip,
  ErrorState,
  LinkButton,
  MarkGlyph,
  OfflineState,
  PointRoute,
  Stage,
  Toast,
  type ToastTone,
  useCountdown,
  useTheme,
} from '@voyyaa/ui-mobile';
import { ApiError, isNetworkError, useLocationConsentStatus } from '@voyyaa/app-runtime';
import { PassengerSummaryRow } from '../../src/components/PassengerSummaryRow';
import { DriverStepRail } from '../../src/components/DriverStepRail';
import { NoShowWait } from '../../src/components/NoShowWait';
import { FinishTripSheet } from '../../src/components/FinishTripSheet';
import { NoShowConfirmSheet } from '../../src/components/NoShowConfirmSheet';
import { CancelTripSheet } from '../../src/components/CancelTripSheet';
import { StartedConfirmSheet } from '../../src/components/StartedConfirmSheet';
import { StartCodeSheet } from '../../src/components/StartCodeSheet';
import { StartBlockedPanel, type BlockedNoShow } from '../../src/components/StartBlockedPanel';
import { RouteButton } from '../../src/components/RouteButton';
import { SharingStatusBadge } from '../../src/components/SharingStatusBadge';
import { useDriverHome } from '../../src/hooks/useDriverHome';
import {
  useCompleteTrip,
  useDeclareNoShow,
  useMarkTripArrived,
  useMarkTripEnRoute,
  useStartTrip,
} from '../../src/hooks/useTripActions';
import { useCancelAssignmentByDriver } from '../../src/hooks/useCancelAssignmentByDriver';
import { useBestEffortLocationReport } from '../../src/hooks/useReportLocation';
import { dispatchSharing } from '../../src/tracking/sharing-runtime';
import { isStartCodeRequiredError } from '../../src/trip/start-code-flow';
import { driverCopy } from '../../src/copy/driver-copy';

type SubState = 'en_camino' | 'esperando' | 'en_curso';
type SheetKind =
  'finish' | 'no_show' | 'cancel' | 'started' | 'start_code' | 'already_started' | null;
type ActionIssue = 'offline' | 'generic' | null;

interface ClosedState {
  title: string;
  glyph: 'success' | 'empty';
}

const STEP_INDEX: Record<SubState, number> = { en_camino: 0, esperando: 1, en_curso: 2 };
const CLOSE_REDIRECT_MS = 1100;
const TOAST_DURATION_MS = 1000;
const SHARING_STOPPED_TOAST_MS = 3200;
const REMATE_GLYPH_SIZE = 96;

function actionErrorMessage(issue: ActionIssue): string {
  return issue === 'offline' ? driverCopy.trip.actionOffline : driverCopy.trip.actionGeneric;
}

function secondsBetween(fromIso: string | null, toIso: string | null): number {
  if (!fromIso || !toIso) return 0;
  return Math.max(0, Math.round((new Date(toIso).getTime() - new Date(fromIso).getTime()) / 1000));
}

export default function ActiveTripScreen(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const home = useDriverHome();
  const activeTrip = home.data?.active_trip ?? null;
  const activeTripRequestId = activeTrip?.trip_request_id ?? null;
  const reportLocationBestEffort = useBestEffortLocationReport();

  const enRoute = useMarkTripEnRoute(activeTripRequestId);
  const arrived = useMarkTripArrived(activeTripRequestId);
  const start = useStartTrip(activeTripRequestId);
  const complete = useCompleteTrip(activeTripRequestId);
  const noShow = useDeclareNoShow(activeTripRequestId);
  const cancelAssignment = useCancelAssignmentByDriver(activeTrip?.assignment_id ?? null);

  const [actionIssue, setActionIssue] = useState<ActionIssue>(null);
  const [lastPrimaryAction, setLastPrimaryAction] = useState<
    'en-route' | 'arrived' | 'start' | null
  >(null);
  const [sheet, setSheet] = useState<SheetKind>(null);
  const [sheetError, setSheetError] = useState<string | undefined>(undefined);
  const [toast, setToast] = useState<{
    message: string;
    tone: ToastTone;
    durationMs?: number;
  } | null>(null);
  const [closed, setClosed] = useState<ClosedState | null>(null);

  useEffect(() => {
    if (!home.isLoading && !activeTrip && !closed) {
      router.replace('/');
    }
  }, [home.isLoading, activeTrip, closed, router]);

  const consentStatus = useLocationConsentStatus();
  const consentRequired = consentStatus.data?.requires_acceptance === true;
  const previousConsentRequired = useRef(consentRequired);
  useEffect(() => {
    if (previousConsentRequired.current && !consentRequired) {
      setToast({ message: driverCopy.sharing.consentDone, tone: 'success' });
    }
    previousConsentRequired.current = consentRequired;
  }, [consentRequired]);

  const startBlockedNow = activeTrip?.start_blocked ?? false;
  useEffect(() => {
    if (startBlockedNow && (sheet === 'start_code' || sheet === 'already_started')) {
      setSheet(null);
      AccessibilityInfo.announceForAccessibility(driverCopy.blocked.announcement);
    }
  }, [startBlockedNow, sheet]);

  const subState: SubState | null = !activeTrip
    ? null
    : activeTrip.status === 'in_progress'
      ? 'en_curso'
      : activeTrip.status === 'driver_en_route' && activeTrip.arrived_at
        ? 'esperando'
        : 'en_camino';

  const passengerName = activeTrip?.passenger.name.trim() || null;

  const title = !activeTrip
    ? ''
    : subState === 'en_curso'
      ? driverCopy.trip.inProgressTitle
      : subState === 'esperando'
        ? driverCopy.trip.waitingTitle(passengerName)
        : driverCopy.trip.enRouteTitle(passengerName);

  const announcedTitle = useRef<string | null>(null);
  useEffect(() => {
    if (!title) return;
    if (announcedTitle.current !== null && announcedTitle.current !== title) {
      AccessibilityInfo.announceForAccessibility(title);
    }
    announcedTitle.current = title;
  }, [title]);

  const noShowDeadline = activeTrip?.no_show_available_at ?? null;
  const noShowRemainingSec = useCountdown(noShowDeadline);
  const noShowEnabled = noShowDeadline !== null && noShowRemainingSec <= 0;
  const noShowTotalSec = secondsBetween(activeTrip?.arrived_at ?? null, noShowDeadline);

  function handleActionError(error: unknown): void {
    if (error instanceof ApiError && error.status === 409) {
      void home.refetch();
      return;
    }
    setActionIssue(isNetworkError(error) ? 'offline' : 'generic');
  }

  function handleVoyEnCamino(): void {
    setLastPrimaryAction('en-route');
    setActionIssue(null);
    reportLocationBestEffort();
    enRoute.mutate(undefined, { onError: handleActionError });
  }

  function handleLlegue(): void {
    setLastPrimaryAction('arrived');
    setActionIssue(null);
    reportLocationBestEffort();
    arrived.mutate(undefined, { onError: handleActionError });
  }

  function handleIniciar(): void {
    if (activeTrip?.start_code_required) {
      setActionIssue(null);
      setSheet('start_code');
      return;
    }
    setLastPrimaryAction('start');
    setActionIssue(null);
    reportLocationBestEffort();
    start.mutate(undefined, {
      onSuccess: () => dispatchSharing({ type: 'trip_started' }),
      onError: (error) => {
        if (isStartCodeRequiredError(error)) {
          void home.refetch();
          setSheet('start_code');
          return;
        }
        handleActionError(error);
      },
    });
  }

  function handleCodeStarted(): void {
    closeSheet();
    setToast({
      message: driverCopy.sharing.stoppedToast,
      tone: 'neutral',
      durationMs: SHARING_STOPPED_TOAST_MS,
    });
    void home.refetch();
  }

  function handleCodeBlocked(): void {
    closeSheet();
    AccessibilityInfo.announceForAccessibility(driverCopy.blocked.announcement);
    void home.refetch();
  }

  function handleTripChangedUnderSheet(): void {
    closeSheet();
    setToast({ message: driverCopy.startCode.tripChanged, tone: 'neutral' });
    void home.refetch();
  }

  function retryLastPrimaryAction(): void {
    if (lastPrimaryAction === 'en-route') handleVoyEnCamino();
    else if (lastPrimaryAction === 'arrived') handleLlegue();
    else if (lastPrimaryAction === 'start') handleIniciar();
  }

  function closeSheet(): void {
    setSheet(null);
    setSheetError(undefined);
  }

  function sheetFailure(error: unknown): void {
    setSheetError(actionErrorMessage(isNetworkError(error) ? 'offline' : 'generic'));
  }

  function handleStartedConfirm(): void {
    setSheetError(undefined);
    reportLocationBestEffort();
    start.mutate(undefined, {
      onSuccess: () => {
        dispatchSharing({ type: 'trip_started' });
        closeSheet();
      },
      onError: (error) => {
        if (isStartCodeRequiredError(error)) {
          void home.refetch();
          setSheet('already_started');
          return;
        }
        if (error instanceof ApiError && error.status === 409) {
          closeSheet();
          void home.refetch();
          return;
        }
        sheetFailure(error);
      },
    });
  }

  function closeWithRemate(state: ClosedState, message: string, tone: ToastTone): void {
    closeSheet();
    setClosed(state);
    setToast({ message, tone });
    setTimeout(() => router.replace('/'), CLOSE_REDIRECT_MS);
  }

  function handleFinishConfirm(cashCollected: boolean): void {
    setSheetError(undefined);
    complete.mutate(
      { cash_collected: cashCollected },
      {
        onSuccess: () =>
          closeWithRemate(
            { title: driverCopy.trip.closedFinished, glyph: 'success' },
            cashCollected ? driverCopy.trip.toastFinishedCash : driverCopy.trip.toastFinished,
            'success',
          ),
        onError: sheetFailure,
      },
    );
  }

  function handleNoShowConfirm(): void {
    setSheetError(undefined);
    reportLocationBestEffort();
    noShow.mutate(undefined, {
      onSuccess: () =>
        closeWithRemate(
          { title: driverCopy.trip.closedNoShow, glyph: 'empty' },
          driverCopy.trip.toastNoShow,
          'neutral',
        ),
      onError: sheetFailure,
    });
  }

  function handleCancelConfirm(reason: string): void {
    setSheetError(undefined);
    cancelAssignment.mutate(
      { reason },
      {
        onSuccess: () =>
          closeWithRemate(
            { title: driverCopy.trip.closedCancelled, glyph: 'empty' },
            driverCopy.trip.toastCancelled,
            'neutral',
          ),
        onError: sheetFailure,
      },
    );
  }

  if (closed) {
    return (
      <Stage topInset={insets.top} style={{ flex: 1 }}>
        <View
          testID="trip-closed"
          accessibilityRole="alert"
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            gap: theme.spacing.lg,
            padding: theme.spacing.xl,
          }}
        >
          <MarkGlyph
            glyph={closed.glyph}
            size={REMATE_GLYPH_SIZE}
            color={closed.glyph === 'success' ? theme.colors.success : theme.colors.onStageMuted}
          />
          <Text
            style={{
              ...theme.typography.headline,
              color: theme.colors.onStage,
              textAlign: 'center',
            }}
          >
            {closed.title}
          </Text>
        </View>
        <Toast
          message={toast?.message ?? ''}
          tone={toast?.tone ?? 'neutral'}
          visible={toast !== null}
          durationMs={TOAST_DURATION_MS}
          onHide={() => setToast(null)}
        />
      </Stage>
    );
  }

  if (home.isError && !home.data) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.bg, paddingTop: insets.top }}>
        {isNetworkError(home.error) ? (
          <OfflineState onRetry={() => home.refetch()} />
        ) : (
          <ErrorState title={driverCopy.trip.loadError} onRetry={() => home.refetch()} />
        )}
      </View>
    );
  }

  if (home.isLoading || !activeTrip || !subState) {
    return (
      <Stage topInset={insets.top} style={{ flex: 1 }}>
        <BrandLoader variant="screen" label={driverCopy.trip.loadingLabel} />
      </Stage>
    );
  }

  const isAssignedNotYetMoving = activeTrip.status === 'assigned';
  const towardsDropoff = subState === 'en_curso';
  const routeTarget = towardsDropoff ? activeTrip.dropoff_location : activeTrip.pickup_location;
  const startBlocked = activeTrip.start_blocked && subState !== 'en_curso';
  const blockedNoShow: BlockedNoShow =
    subState === 'en_camino'
      ? { kind: 'needs_arrival', loading: arrived.isPending }
      : noShowEnabled
        ? { kind: 'enabled' }
        : { kind: 'waiting', remainingSec: noShowRemainingSec };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <Stage topInset={insets.top}>
        <View
          style={{
            paddingHorizontal: theme.spacing.gutter,
            paddingTop: theme.spacing.lg,
            paddingBottom: theme.spacing.xl + theme.radius.sheet / 2,
            gap: theme.spacing.lg,
          }}
        >
          <Text
            accessibilityRole="header"
            numberOfLines={2}
            style={{ ...theme.typography.title, color: theme.colors.onStage }}
          >
            {title}
          </Text>
          <DriverStepRail
            steps={[
              driverCopy.trip.steps.enRoute,
              driverCopy.trip.steps.waiting,
              driverCopy.trip.steps.inProgress,
            ]}
            activeIndex={STEP_INDEX[subState]}
          />
        </View>
      </Stage>

      <View
        style={{
          flex: 1,
          marginTop: -theme.radius.sheet,
          backgroundColor: theme.colors.bg,
          borderTopLeftRadius: theme.radius.sheet,
          borderTopRightRadius: theme.radius.sheet,
        }}
      >
        <ScrollView
          contentContainerStyle={{
            padding: theme.spacing.gutter,
            paddingBottom: insets.bottom + theme.spacing.xl,
            gap: theme.spacing.md,
            flexGrow: 1,
          }}
        >
          <SharingStatusBadge
            sharing={activeTrip.location_sharing}
            consentRequired={consentRequired}
            onReadConsent={() => router.push('/privacy')}
          />

          <PassengerSummaryRow
            passengerName={activeTrip.passenger.name}
            price={activeTrip.fare.total}
          />

          {subState === 'esperando' && (
            <View style={{ alignSelf: 'flex-start' }}>
              <Chip tone="brandTint" label={driverCopy.trip.arrivedChip} />
            </View>
          )}

          <Card>
            <PointRoute
              origin={{ label: driverCopy.trip.pickupLabel, value: activeTrip.pickup_address }}
              destination={{
                label: driverCopy.trip.destinationLabel,
                value: activeTrip.dropoff_address,
              }}
            />
          </Card>

          <RouteButton target={routeTarget} leg={towardsDropoff ? 'dropoff' : 'pickup'} />

          {actionIssue && subState !== 'en_curso' && (
            <View accessibilityRole="alert" style={{ gap: theme.spacing.sm }}>
              <Text style={{ ...theme.typography.bodyStrong, color: theme.colors.dangerInk }}>
                {actionErrorMessage(actionIssue)}
              </Text>
              <Button
                label={driverCopy.issues.retry}
                variant="secondary"
                onPress={retryLastPrimaryAction}
              />
            </View>
          )}

          <View style={{ flex: 1 }} />

          {startBlocked && (
            <StartBlockedPanel
              passengerPhone={activeTrip.passenger.contact_phone}
              noShow={blockedNoShow}
              onArrived={handleLlegue}
              onNoShow={() => setSheet('no_show')}
              onCancel={() => setSheet('cancel')}
            />
          )}

          <View style={{ gap: theme.spacing.lg }}>
            {!startBlocked && subState === 'en_camino' && (
              <Button
                label={
                  isAssignedNotYetMoving ? driverCopy.trip.startEnRoute : driverCopy.trip.arrived
                }
                size="lg"
                loading={isAssignedNotYetMoving ? enRoute.isPending : arrived.isPending}
                onPress={isAssignedNotYetMoving ? handleVoyEnCamino : handleLlegue}
                testID="trip-primary"
              />
            )}

            {!startBlocked && subState === 'esperando' && (
              <>
                <Button
                  label={driverCopy.trip.startTrip}
                  size="lg"
                  loading={start.isPending}
                  accessibilityHint={
                    activeTrip.start_code_required ? driverCopy.trip.startTripHint : undefined
                  }
                  onPress={handleIniciar}
                  testID="trip-primary"
                />
                {!noShowEnabled && (
                  <NoShowWait remainingSec={noShowRemainingSec} totalSec={noShowTotalSec} />
                )}
              </>
            )}

            {subState === 'en_curso' && (
              <Button
                label={driverCopy.trip.finishTrip}
                size="lg"
                onPress={() => setSheet('finish')}
                testID="trip-primary"
              />
            )}

            {!startBlocked && subState !== 'en_curso' && (
              <View style={{ gap: theme.spacing.xs }}>
                <Text style={{ ...theme.typography.eyebrow, color: theme.colors.textMuted }}>
                  {driverCopy.trip.moreOptions}
                </Text>
                <View
                  style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: theme.spacing.lg }}
                >
                  {subState === 'en_camino' && (
                    <LinkButton
                      label={driverCopy.trip.alreadyStarted}
                      tone="muted"
                      onPress={() =>
                        setSheet(activeTrip.start_code_required ? 'already_started' : 'started')
                      }
                      testID="trip-already-started"
                    />
                  )}
                  {subState === 'esperando' && noShowEnabled && (
                    <LinkButton
                      label={driverCopy.trip.noShow}
                      tone="danger"
                      onPress={() => setSheet('no_show')}
                      testID="trip-no-show"
                    />
                  )}
                  <LinkButton
                    label={driverCopy.trip.cancelTrip}
                    onPress={() => setSheet('cancel')}
                    testID="trip-cancel"
                  />
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </View>

      <StartCodeSheet
        visible={sheet === 'start_code' || sheet === 'already_started'}
        variant={sheet === 'already_started' ? 'already_started' : 'start'}
        tripRequestId={activeTripRequestId}
        attemptsRemaining={activeTrip.start_attempts_remaining}
        onClose={closeSheet}
        onStarted={handleCodeStarted}
        onBlocked={handleCodeBlocked}
        onChanged={handleTripChangedUnderSheet}
      />
      <StartedConfirmSheet
        visible={sheet === 'started'}
        loading={start.isPending}
        errorMessage={sheetError}
        onConfirm={handleStartedConfirm}
        onKeepWaiting={closeSheet}
      />
      <FinishTripSheet
        visible={sheet === 'finish'}
        price={activeTrip.fare.total}
        loading={complete.isPending}
        errorMessage={sheetError}
        onConfirm={handleFinishConfirm}
        onKeepGoing={closeSheet}
      />
      <NoShowConfirmSheet
        visible={sheet === 'no_show'}
        loading={noShow.isPending}
        errorMessage={sheetError}
        onConfirm={handleNoShowConfirm}
        onKeepWaiting={closeSheet}
      />
      <CancelTripSheet
        visible={sheet === 'cancel'}
        loading={cancelAssignment.isPending}
        errorMessage={sheetError}
        onConfirm={handleCancelConfirm}
        onKeepGoing={closeSheet}
      />

      <Toast
        message={toast?.message ?? ''}
        tone={toast?.tone ?? 'neutral'}
        visible={toast !== null}
        durationMs={toast?.durationMs ?? TOAST_DURATION_MS}
        onHide={() => setToast(null)}
      />
    </View>
  );
}

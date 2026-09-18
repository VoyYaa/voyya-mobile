import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Linking, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Button,
  Chip,
  PointRow,
  ScreenHeader,
  Skeleton,
  Toast,
  type ToastTone,
  formatMMSS,
  useCountdown,
  useTheme,
} from '@voyyaa/ui-mobile';
import { ApiError, isNetworkError } from '@voyyaa/app-runtime';
import { PassengerSummaryRow } from '../../src/components/PassengerSummaryRow';
import { FinishTripSheet } from '../../src/components/FinishTripSheet';
import { NoShowConfirmSheet } from '../../src/components/NoShowConfirmSheet';
import { CancelTripSheet } from '../../src/components/CancelTripSheet';
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
import { LocationIssueBanner } from '../../src/components/LocationIssueBanner';
import { useLocationIssueStore } from '../../src/state/useLocationIssueStore';

type SubState = 'en_camino' | 'esperando' | 'en_curso';
type SheetKind = 'finish' | 'no_show' | 'cancel' | null;
type ActionIssue = 'offline' | 'generic' | null;

function actionErrorMessage(issue: ActionIssue): string {
  return issue === 'offline'
    ? 'Sin conexión · no pudimos enviar tu acción.'
    : 'No pudimos procesar la acción.';
}

function noShowAccessibleLabel(remainingSec: number): string {
  const minutes = Math.floor(remainingSec / 60);
  const seconds = remainingSec % 60;
  const parts: string[] = [];
  if (minutes > 0) parts.push(`${minutes} minuto${minutes === 1 ? '' : 's'}`);
  parts.push(`${seconds} segundo${seconds === 1 ? '' : 's'}`);
  return `Disponible en ${parts.join(' con ')}`;
}

export default function ActiveTripScreen(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();

  const home = useDriverHome();
  const activeTrip = home.data?.active_trip ?? null;
  const activeTripRequestId = activeTrip?.trip_request_id ?? null;
  const reportLocationBestEffort = useBestEffortLocationReport();
  const locationIssue = useLocationIssueStore((s) => s.issue);

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
  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null);

  useEffect(() => {
    if (!home.isLoading && !activeTrip) {
      router.replace('/');
    }
  }, [home.isLoading, activeTrip, router]);

  const subState: SubState | null = !activeTrip
    ? null
    : activeTrip.status === 'in_progress'
      ? 'en_curso'
      : activeTrip.status === 'driver_en_route' && activeTrip.arrived_at
        ? 'esperando'
        : 'en_camino';

  const title = !activeTrip
    ? ''
    : subState === 'en_curso'
      ? 'Viaje en curso'
      : subState === 'esperando'
        ? `Esperando a ${activeTrip.passenger.name}`
        : `En camino a recoger a ${activeTrip.passenger.name}`;

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
    setLastPrimaryAction('start');
    setActionIssue(null);
    reportLocationBestEffort();
    start.mutate(undefined, { onError: handleActionError });
  }

  function retryLastPrimaryAction(): void {
    if (lastPrimaryAction === 'en-route') handleVoyEnCamino();
    else if (lastPrimaryAction === 'arrived') handleLlegue();
    else if (lastPrimaryAction === 'start') handleIniciar();
  }

  function closeWithToast(message: string, tone: ToastTone): void {
    setSheet(null);
    setSheetError(undefined);
    setToast({ message, tone });
    setTimeout(() => router.replace('/'), 1100);
  }

  function handleFinishConfirm(cashCollected: boolean): void {
    setSheetError(undefined);
    complete.mutate(
      { cash_collected: cashCollected },
      {
        onSuccess: () =>
          closeWithToast(
            cashCollected ? 'Viaje finalizado. Cobro confirmado.' : 'Viaje finalizado.',
            'success',
          ),
        onError: (error) =>
          setSheetError(actionErrorMessage(isNetworkError(error) ? 'offline' : 'generic')),
      },
    );
  }

  function handleNoShowConfirm(): void {
    setSheetError(undefined);
    reportLocationBestEffort();
    noShow.mutate(undefined, {
      onSuccess: () => closeWithToast('Viaje cerrado · el pasajero no se presentó.', 'neutral'),
      onError: (error) =>
        setSheetError(actionErrorMessage(isNetworkError(error) ? 'offline' : 'generic')),
    });
  }

  function handleCancelConfirm(reason: string): void {
    setSheetError(undefined);
    cancelAssignment.mutate(
      { reason },
      {
        onSuccess: () => closeWithToast('Viaje cancelado.', 'neutral'),
        onError: (error) =>
          setSheetError(actionErrorMessage(isNetworkError(error) ? 'offline' : 'generic')),
      },
    );
  }

  if (home.isLoading || !activeTrip || !subState) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
        <ScreenHeader title="Viaje" />
        <View style={{ padding: theme.spacing.lg, gap: theme.spacing.md }}>
          <Skeleton height={72} radius={theme.radius.card} />
          <Skeleton height={120} radius={theme.radius.card} />
        </View>
      </SafeAreaView>
    );
  }

  const isAssignedNotYetMoving = activeTrip.status === 'assigned';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <ScreenHeader title={title} />
      <ScrollView
        contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.md, flexGrow: 1 }}
      >
        {locationIssue && (
          <LocationIssueBanner
            kind={locationIssue}
            onOpenSettings={() => void Linking.openSettings()}
          />
        )}

        <PassengerSummaryRow
          passengerName={activeTrip.passenger.name}
          price={activeTrip.fare.total}
        />

        {subState === 'esperando' && (
          <View style={{ alignSelf: 'flex-start' }}>
            <Chip tone="brandTint" label="Llegaste · cortesía en curso" />
          </View>
        )}

        <View style={{ gap: theme.spacing.sm as number }}>
          <PointRow marker="●" label="Recoger en" value={activeTrip.pickup_address} />
          <PointRow
            marker="▼"
            label="Destino"
            value={activeTrip.dropoff_address}
            markerColor={theme.colors.brandInk}
          />
        </View>
        <Text style={{ ...theme.typography.small, color: theme.colors.textMuted }}>
          Ruta de referencia
        </Text>

        {actionIssue && subState !== 'en_curso' && (
          <View accessibilityRole="alert">
            <Text
              style={{ ...theme.typography.body, fontWeight: '700', color: theme.colors.dangerInk }}
            >
              {actionErrorMessage(actionIssue)}
            </Text>
            <Button
              label="Reintentar"
              onPress={retryLastPrimaryAction}
              style={{ marginTop: theme.spacing.sm }}
            />
          </View>
        )}

        <View style={{ flex: 1 }} />

        <View style={{ gap: theme.spacing.xl as number }}>
          {subState === 'en_camino' && (
            <>
              <Button
                label={isAssignedNotYetMoving ? 'Voy en camino' : 'Llegué al punto de recogida'}
                loading={isAssignedNotYetMoving ? enRoute.isPending : arrived.isPending}
                onPress={isAssignedNotYetMoving ? handleVoyEnCamino : handleLlegue}
                style={{ minHeight: 56 }}
              />
              <View style={{ gap: theme.spacing.sm as number }}>
                <Text
                  accessibilityRole="link"
                  onPress={handleIniciar}
                  style={{ ...theme.typography.small, color: theme.colors.textMuted }}
                >
                  Ya inició el viaje
                </Text>
                <Text
                  accessibilityRole="link"
                  onPress={() => setSheet('cancel')}
                  style={{ ...theme.typography.body, fontWeight: '600', color: theme.colors.text }}
                >
                  Cancelar viaje
                </Text>
              </View>
            </>
          )}

          {subState === 'esperando' && (
            <>
              <Button
                label="Inicié el viaje"
                loading={start.isPending}
                onPress={handleIniciar}
                style={{ minHeight: 56 }}
              />
              <View style={{ gap: theme.spacing.sm as number }}>
                {noShowEnabled ? (
                  <Text
                    accessibilityRole="link"
                    onPress={() => setSheet('no_show')}
                    style={{
                      ...theme.typography.body,
                      fontWeight: '600',
                      color: theme.colors.dangerInk,
                    }}
                  >
                    Pasajero no se presentó
                  </Text>
                ) : (
                  <Text
                    accessibilityLabel={noShowAccessibleLabel(noShowRemainingSec)}
                    style={{ ...theme.typography.small, color: theme.colors.textMuted }}
                  >
                    Pasajero no se presentó (disponible en {formatMMSS(noShowRemainingSec)})
                  </Text>
                )}
                <Text
                  accessibilityRole="link"
                  onPress={() => setSheet('cancel')}
                  style={{ ...theme.typography.body, fontWeight: '600', color: theme.colors.text }}
                >
                  Cancelar viaje
                </Text>
              </View>
            </>
          )}

          {subState === 'en_curso' && (
            <Button
              label="Finalizar viaje"
              onPress={() => setSheet('finish')}
              style={{ minHeight: 56 }}
            />
          )}
        </View>
      </ScrollView>

      <FinishTripSheet
        visible={sheet === 'finish'}
        price={activeTrip.fare.total}
        loading={complete.isPending}
        errorMessage={sheetError}
        onConfirm={handleFinishConfirm}
        onKeepGoing={() => {
          setSheet(null);
          setSheetError(undefined);
        }}
      />
      <NoShowConfirmSheet
        visible={sheet === 'no_show'}
        loading={noShow.isPending}
        errorMessage={sheetError}
        onConfirm={handleNoShowConfirm}
        onKeepWaiting={() => {
          setSheet(null);
          setSheetError(undefined);
        }}
      />
      <CancelTripSheet
        visible={sheet === 'cancel'}
        loading={cancelAssignment.isPending}
        errorMessage={sheetError}
        onConfirm={handleCancelConfirm}
        onKeepGoing={() => {
          setSheet(null);
          setSheetError(undefined);
        }}
      />

      <Toast
        message={toast?.message ?? ''}
        tone={toast?.tone ?? 'neutral'}
        visible={toast !== null}
        durationMs={1000}
        onHide={() => setToast(null)}
      />
    </SafeAreaView>
  );
}

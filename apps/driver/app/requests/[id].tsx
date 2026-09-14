import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, BackHandler, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Button,
  CountdownRing,
  type CountdownRingStatus,
  ErrorState,
  Map,
  PointRow,
  ScreenHeader,
  Toast,
  type ToastTone,
  useCountdown,
  useReducedMotion,
  useTheme,
} from '@voyyaa/ui-mobile';
import { isNetworkError } from '@voyyaa/app-runtime';
import type { AssignmentNotification } from '@voyyaa/shared';
import { PassengerSummaryRow } from '../../src/components/PassengerSummaryRow';
import { ActionButtonPair } from '../../src/components/ActionButtonPair';
import { useAcceptAssignment } from '../../src/hooks/useAcceptAssignment';
import { useRejectAssignment } from '../../src/hooks/useRejectAssignment';
import { NEARBY_OFFERS_QUERY_KEY } from '../../src/hooks/useNearbyOffers';
import { COUNTDOWN_WARN_THRESHOLD_SEC } from '../../src/constants/parameters';

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

export default function RequestDetailScreen(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const params = useLocalSearchParams<{ id: string }>();
  const assignmentId = params.id ? Number(params.id) : null;
  const queryClient = useQueryClient();

  const notification: AssignmentNotification | null = assignmentId
    ? ((queryClient.getQueryData<AssignmentNotification[]>(NEARBY_OFFERS_QUERY_KEY) ?? []).find(
        (n) => n.assignment_id === assignmentId,
      ) ?? null)
    : null;

  const [uiStatus, setUiStatus] = useState<UiStatus>('counting');
  const [lastAction, setLastAction] = useState<'accept' | 'reject' | null>(null);
  const mountAnnounced = useRef(false);

  const acceptMutation = useAcceptAssignment(assignmentId);
  const rejectMutation = useRejectAssignment(assignmentId);

  const frozen = uiStatus !== 'counting';
  const remainingSec = useCountdown(notification?.expires_at ?? null, frozen);

  useEffect(() => {
    if (notification && !mountAnnounced.current) {
      mountAnnounced.current = true;
      AccessibilityInfo.announceForAccessibility(
        `Nueva solicitud, quedan ${remainingSec} segundos.`,
      );
    }
  }, [notification?.assignment_id]);

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
          setTimeout(() => router.replace('/'), 800);
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

  useEffect(() => {
    if (uiStatus !== 'counting') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      handleReject();
      return true;
    });
    return () => sub.remove();
  }, [uiStatus]);

  if (!assignmentId || !notification) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
        <ScreenHeader title="Solicitud" onBack={() => router.back()} />
        <ErrorState
          title="No encontramos esta solicitud"
          body="Puede que ya haya expirado o que la lista se haya actualizado."
          onRetry={() => router.replace('/requests')}
          retryLabel="Volver a la lista"
        />
      </SafeAreaView>
    );
  }

  const acceptedResult = acceptMutation.data?.result === 'accepted' ? acceptMutation.data : null;
  const toastByStatus: Partial<
    Record<UiStatus, { message: string; tone: ToastTone; durationMs: number }>
  > = {
    accepted: {
      message: acceptedResult
        ? `¡Aceptada! Vas hacia ${acceptedResult.passenger.name}.`
        : '¡Aceptada!',
      tone: 'success',
      durationMs: 800,
    },
    rejected: {
      message: 'Rechazada · buscando otro conductor.',
      tone: 'neutral',
      durationMs: 900,
    },
    expired: {
      message: 'Se agotó el tiempo · pasando al siguiente conductor.',
      tone: 'neutral',
      durationMs: 900,
    },
    taken_by_other: {
      message: 'Esta solicitud ya fue tomada · sigues en turno, te avisaremos de la próxima.',
      tone: 'neutral',
      durationMs: 1200,
    },
  };
  const toast = toastByStatus[uiStatus];

  const canDecide = !NO_DECISION_STATES.includes(uiStatus);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <ScreenHeader
        title="Nueva solicitud"
        onBack={uiStatus === 'counting' ? undefined : () => router.back()}
      />
      <ScrollView
        contentContainerStyle={{
          padding: theme.spacing.lg,
          gap: theme.spacing.lg,
          alignItems: 'center',
        }}
      >
        <CountdownRing
          durationSec={notification.seconds_to_respond}
          remainingSec={remainingSec}
          status={RING_STATUS_BY_UI[uiStatus]}
          warnThresholdSec={COUNTDOWN_WARN_THRESHOLD_SEC}
          reducedMotion={reducedMotion}
          onExpire={handleLocalExpiration}
        />

        <View style={{ width: '100%' }}>
          <PassengerSummaryRow price={notification.total_fare} />
        </View>

        <Map
          center={{ lat: notification.origin.lat, lng: notification.origin.lng }}
          markers={[
            {
              id: 'origin',
              kind: 'origin',
              coord: { lat: notification.origin.lat, lng: notification.origin.lng },
              label: `Recoger en ${notification.origin.address}`,
            },
          ]}
          interactive={false}
          height={120}
          style={{ width: '100%' }}
        />
        <Text style={{ ...theme.typography.small, color: theme.colors.textMuted }}>
          Recoger a {notification.distance_to_origin_m} m
        </Text>

        <View style={{ width: '100%', gap: theme.spacing.sm as number }}>
          <PointRow marker="●" label="Recoger en" value={notification.origin.address} />
          <PointRow
            marker="▼"
            label="Destino"
            value={notification.dropoff_neighborhood}
            markerColor={theme.colors.brandPressed}
          />
        </View>

        {(uiStatus === 'offline_response' || uiStatus === 'generic_error') && (
          <View accessibilityRole="alert" style={{ width: '100%' }}>
            <Text
              style={{ ...theme.typography.body, fontWeight: '700', color: theme.colors.danger }}
            >
              {uiStatus === 'offline_response'
                ? 'Sin conexión · no pudimos enviar tu respuesta.'
                : 'No pudimos procesar tu respuesta.'}
            </Text>
            <Button label="Reintentar" onPress={retry} style={{ marginTop: theme.spacing.sm }} />
          </View>
        )}

        <View style={{ width: '100%', marginTop: theme.spacing.md }}>
          <ActionButtonPair
            onAccept={handleAccept}
            onReject={handleReject}
            loading={
              uiStatus === 'accepting' ? 'accept' : uiStatus === 'rejecting' ? 'reject' : null
            }
            disabled={!canDecide}
          />
        </View>
      </ScrollView>

      <Toast
        message={toast?.message ?? ''}
        tone={toast?.tone ?? 'neutral'}
        visible={Boolean(toast)}
        durationMs={toast?.durationMs}
        onHide={() => {}}
      />
    </SafeAreaView>
  );
}

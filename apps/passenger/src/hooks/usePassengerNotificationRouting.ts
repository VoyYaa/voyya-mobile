import { useCallback, useEffect, useReducer, useRef } from 'react';
import { useGlobalSearchParams, usePathname, useRouter } from 'expo-router';
import type { NotificationResponse } from 'expo-notifications';
import { loadNotificationsModule, useNetworkStatus, useSessionStore } from '@voyyaa/app-runtime';
import { getActiveTrip, getTripRequestStatus } from '../api/trips.api';
import { isSameTripRoute, type CurrentRoute } from '../lib/active-trip-route';
import {
  resolveNotificationTarget,
  type NotificationTarget,
  type NotificationTargetApi,
} from '../lib/notification-target';
import {
  INITIAL_TAP_STATE,
  canResolveTap,
  tapPhase,
  tapReducer,
  type NotificationTapPhase,
  type PendingTap,
  type TapOrigin,
} from '../lib/notification-tap-state';
import { useActiveTripCache } from './useActiveTrip';

export interface NotificationTapState {
  phase: NotificationTapPhase;
  retry: () => void;
  skip: () => void;
}

const targetApi: NotificationTargetApi = {
  getActiveTrip: async () => (await getActiveTrip()).active_trip,
  getTrip: getTripRequestStatus,
};

let handledResponseId: string | null = null;

function responseId(response: NotificationResponse): string {
  const { notification, actionIdentifier } = response;
  return `${notification.request.identifier}|${notification.date}|${actionIdentifier}`;
}

function ageOf(response: NotificationResponse): number | null {
  const sentAt = response.notification.date;
  return Number.isFinite(sentAt) ? Date.now() - sentAt : null;
}

export function usePassengerNotificationRouting(options: {
  startupSettled: boolean;
}): NotificationTapState {
  const router = useRouter();
  const pathname = usePathname();
  const { id } = useGlobalSearchParams<{ id?: string }>();
  const cache = useActiveTripCache();
  const sessionStatus = useSessionStore((s) => s.status);
  const network = useNetworkStatus();
  const [state, dispatch] = useReducer(tapReducer, INITIAL_TAP_STATE);

  const generation = useRef(0);
  const currentRoute = useRef<CurrentRoute>({ pathname, id });
  currentRoute.current = { pathname, id };
  const networkRef = useRef(network);

  const accept = useCallback((response: NotificationResponse, origin: TapOrigin): void => {
    const responseKey = responseId(response);
    if (responseKey === handledResponseId) return;
    handledResponseId = responseKey;
    dispatch({
      type: 'tapped',
      tap: {
        rawData: response.notification.request.content.data,
        ageMs: ageOf(response),
        origin,
      },
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    let subscription: { remove: () => void } | null = null;
    void loadNotificationsModule().then(async (notifications) => {
      if (cancelled || notifications === null) return;
      subscription = notifications.addNotificationResponseReceivedListener((response) =>
        accept(response, 'background'),
      );
      const last = await notifications.getLastNotificationResponseAsync().catch(() => null);
      if (!cancelled && last !== null) accept(last, 'cold');
    });
    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [accept]);

  const navigate = (target: NotificationTarget): void => {
    if (target.kind === 'route') {
      cache.seed(target.trip);
      if (!isSameTripRoute(currentRoute.current, target.route)) router.replace(target.route);
      return;
    }
    if (target.kind === 'home') {
      router.replace(target.notice ? { pathname: '/', params: { notice: target.notice } } : '/');
    }
  };
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  const context = {
    authenticated: sessionStatus === 'authenticated',
    hydrating: sessionStatus === 'hydrating',
    startupSettled: options.startupSettled,
  };

  useEffect(() => {
    if (state.pending !== null && !context.hydrating && !context.authenticated) {
      dispatch({ type: 'session_ended' });
    }
  }, [state.pending, context.hydrating, context.authenticated]);

  useEffect(() => {
    const tap: PendingTap | null = state.pending;
    if (tap === null || !canResolveTap(state, context)) return;

    const current = ++generation.current;
    void resolveNotificationTarget(targetApi, {
      authenticated: true,
      rawData: tap.rawData,
      ageMs: tap.ageMs,
    }).then((target) => {
      if (current !== generation.current) return;
      navigateRef.current(target);
      dispatch({ type: 'resolved', target, networkOffline: networkRef.current === 'offline' });
    });
  }, [
    state.pending,
    state.failure,
    state.waitingForNetwork,
    state.attempt,
    context.authenticated,
    context.hydrating,
    context.startupSettled,
  ]);

  useEffect(() => {
    const cameBack = networkRef.current === 'offline' && network === 'online';
    networkRef.current = network;
    if (cameBack) dispatch({ type: 'network_restored' });
  }, [network]);

  const retry = useCallback((): void => dispatch({ type: 'retry' }), []);

  const skip = useCallback((): void => {
    generation.current += 1;
    dispatch({ type: 'skip' });
    router.replace('/');
  }, [router]);

  return { phase: tapPhase(state), retry, skip };
}

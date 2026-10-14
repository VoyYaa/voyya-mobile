import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { usePathname } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import {
  dismissAllPushNotifications,
  loadNotificationsModule,
  useSessionStore,
} from '@voyyaa/app-runtime';
import { foregroundPresentation } from '../lib/foreground-policy';
import { ACTIVE_TRIP_QUERY_PREFIX, TRIP_REQUEST_QUERY_PREFIX } from './useActiveTrip';

export function useForegroundNotifications(): void {
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const authenticated = useSessionStore((s) => s.status === 'authenticated');
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  useEffect(() => {
    let cancelled = false;
    let subscription: { remove: () => void } | null = null;
    void loadNotificationsModule().then((notifications) => {
      if (cancelled || notifications === null) return;
      notifications.setNotificationHandler({
        handleNotification: async () => foregroundPresentation(pathnameRef.current),
      });
      subscription = notifications.addNotificationReceivedListener(() => {
        void queryClient.invalidateQueries({ queryKey: ACTIVE_TRIP_QUERY_PREFIX });
        void queryClient.invalidateQueries({ queryKey: TRIP_REQUEST_QUERY_PREFIX });
      });
    });
    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [queryClient]);

  useEffect(() => {
    if (!authenticated) return undefined;
    void dismissAllPushNotifications().catch(() => undefined);
    const appState = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'active') void dismissAllPushNotifications().catch(() => undefined);
    });
    return () => appState.remove();
  }, [authenticated]);
}

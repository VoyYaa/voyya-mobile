import { useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useNetworkStatus } from '../connectivity/useNetworkStatus';
import { useSessionStore } from '../session/useSessionStore';
import { forgetPushNotificationsState, syncPushNotifications } from './push-notifications';
import { pushSyncKey } from './push-sync-key';
import { usePushStore } from './push-store';

export function usePushRegistration(): void {
  const syncKey = useSessionStore(pushSyncKey);
  const authenticated = syncKey !== 'guest';
  const network = useNetworkStatus();

  useEffect(() => {
    if (!authenticated) {
      forgetPushNotificationsState();
      return undefined;
    }
    void syncPushNotifications();
    const subscription = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'active') void syncPushNotifications();
    });
    return () => subscription.remove();
  }, [syncKey]);

  useEffect(() => {
    if (!authenticated || network !== 'online') return;
    if (usePushStore.getState().registration === 'pending_offline') void syncPushNotifications();
  }, [authenticated, network]);
}

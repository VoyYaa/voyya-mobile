import { useMutation } from '@tanstack/react-query';
import { logout } from '../api/session.api';
import {
  dismissAllPushNotifications,
  forgetRememberedPushToken,
  quiescePushNotifications,
  revokeRememberedPushToken,
} from '../notifications/push-notifications';
import { runLogoutFlow } from './logout-flow';
import { useSessionStore, waitForSessionRefresh } from './useSessionStore';

export function useLogout() {
  return useMutation({
    mutationFn: () =>
      runLogoutFlow({
        waitForSessionRefresh,
        quiescePush: quiescePushNotifications,
        readRefreshToken: () => useSessionStore.getState().refreshToken,
        revokePushToken: revokeRememberedPushToken,
        requestLogout: (refreshToken) => logout({ refresh_token: refreshToken }),
        forgetPushToken: forgetRememberedPushToken,
        dismissAllNotifications: dismissAllPushNotifications,
        clearSession: () => useSessionStore.getState().clearSession(),
      }),
    retry: false,
  });
}

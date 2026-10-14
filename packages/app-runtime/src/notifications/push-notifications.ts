import NetInfo from '@react-native-community/netinfo';
import type { PushTokenPlatform } from '@voyyaa/shared';
import { isOnlineState } from '../query/focus-bridge';
import { expoPushDevicePort } from './expo-push-device';
import { createPushAskedStore } from './push-asked-store';
import { createPushRegistrar, type PushChannel, type PushRegistrar } from './push-registrar';
import type { PushSyncOutcome } from './push-registrar';
import { createPushRevoker } from './push-revocation';
import { registerPushToken, revokePushToken } from './push.api';
import { resetPushState, usePushStore } from './push-store';
import { createPushTokenStore } from './push-token-store';
import { getSecureStoragePort } from '../session/secure-storage-port';
import { useSessionStore } from '../session/useSessionStore';

export const PUSH_QUIESCE_DEADLINE_MS = 2000;

export interface PushNotificationsConfig {
  channel: PushChannel;
  supportedPlatforms: readonly PushTokenPlatform[];
  askPermissionOnSync: boolean;
}

const tokenStore = createPushTokenStore(getSecureStoragePort);
const askedStore = createPushAskedStore(getSecureStoragePort);
const revoker = createPushRevoker({ tokenStore, revoke: revokePushToken });

let runtime: { registrar: PushRegistrar; askPermissionOnSync: boolean } | null = null;

export function configurePushNotifications(config: PushNotificationsConfig): void {
  runtime = {
    askPermissionOnSync: config.askPermissionOnSync,
    registrar: createPushRegistrar({
      device: expoPushDevicePort,
      supportedPlatforms: config.supportedPlatforms,
      channel: config.channel,
      register: registerPushToken,
      tokenStore,
      askedStore,
      revoker,
      sessionEpoch: () => useSessionStore.getState().sessionEpoch,
    }),
  };
}

async function isOnline(): Promise<boolean> {
  try {
    return isOnlineState(await NetInfo.fetch());
  } catch {
    return true;
  }
}

async function run(ask: boolean): Promise<PushSyncOutcome | null> {
  if (runtime === null) return null;
  const outcome = await runtime.registrar.run({ ask, online: await isOnline() });
  if (outcome === null) return null;
  if (useSessionStore.getState().status === 'authenticated') {
    usePushStore.setState({ permission: outcome.permission, registration: outcome.registration });
  }
  return outcome;
}

export async function syncPushNotifications(): Promise<void> {
  if (runtime === null) return;
  if (usePushStore.getState().registration !== 'registered') {
    usePushStore.setState({ registration: 'registering' });
  }
  await run(runtime.askPermissionOnSync);
}

export async function activatePushNotifications(): Promise<PushSyncOutcome | null> {
  usePushStore.setState({ activating: true });
  try {
    return await run(true);
  } finally {
    usePushStore.setState({ activating: false });
  }
}

export function quiescePushNotifications(): Promise<void> {
  return runtime === null
    ? Promise.resolve()
    : runtime.registrar.shutdown(PUSH_QUIESCE_DEADLINE_MS);
}

export function forgetPushNotificationsState(): void {
  resetPushState();
}

export function revokeRememberedPushToken(): Promise<unknown> {
  return revoker.revokeRemembered();
}

export function forgetRememberedPushToken(): Promise<void> {
  return tokenStore.forget();
}

export function dismissAllPushNotifications(): Promise<void> {
  return expoPushDevicePort.dismissAllNotifications();
}

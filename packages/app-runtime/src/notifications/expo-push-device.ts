import { Platform } from 'react-native';
import Constants from 'expo-constants';
import type { PushDevicePlatform, PushDevicePort } from './push-device-port';
import { toPermissionSnapshot } from './push-permission';
import { loadNotificationsModule, type NotificationsModule } from './notifications-module';

const MISSING_MODULE = 'expo-notifications is not available in this build';

async function requireNotifications(): Promise<NotificationsModule> {
  const notifications = await loadNotificationsModule();
  if (notifications === null) throw new Error(MISSING_MODULE);
  return notifications;
}

function resolvePlatform(): PushDevicePlatform {
  if (Platform.OS === 'android' || Platform.OS === 'ios') return Platform.OS;
  return 'web';
}

function resolveProjectId(): string {
  const projectId: unknown = Constants.expoConfig?.extra?.eas?.projectId;
  if (typeof projectId !== 'string' || projectId === '') {
    throw new Error('missing extra.eas.projectId');
  }
  return projectId;
}

export const expoPushDevicePort: PushDevicePort = {
  platform: resolvePlatform(),

  isAvailable: async () => (await loadNotificationsModule()) !== null,

  readPermission: async () =>
    toPermissionSnapshot(await (await requireNotifications()).getPermissionsAsync()),

  requestPermission: async () =>
    toPermissionSnapshot(await (await requireNotifications()).requestPermissionsAsync()),

  isChannelEnabled: async (channelId) => {
    const notifications = await requireNotifications();
    const channel = await notifications.getNotificationChannelAsync(channelId);
    return channel === null || channel.importance !== notifications.AndroidImportance.NONE;
  },

  getExpoPushToken: async () => {
    const notifications = await requireNotifications();
    const { data } = await notifications.getExpoPushTokenAsync({ projectId: resolveProjectId() });
    return data;
  },

  dismissAllNotifications: async () => {
    const notifications = await loadNotificationsModule();
    if (notifications !== null) await notifications.dismissAllNotificationsAsync();
  },
};

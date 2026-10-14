import { Platform } from 'react-native';
import { ANDROID_TRIP_UPDATES_CHANNEL_ID } from '@voyyaa/shared';
import { loadNotificationsModule } from '@voyyaa/app-runtime';
import { notificationsCopy } from '../copy/notifications-copy';

export async function ensureTripUpdatesChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  const notifications = await loadNotificationsModule();
  if (notifications === null) return;

  await notifications.setNotificationChannelAsync(ANDROID_TRIP_UPDATES_CHANNEL_ID, {
    name: notificationsCopy.channel.name,
    description: notificationsCopy.channel.description,
    importance: notifications.AndroidImportance.HIGH,
    sound: 'default',
    enableVibrate: true,
    showBadge: false,
    lockscreenVisibility: notifications.AndroidNotificationVisibility.PUBLIC,
  });
}

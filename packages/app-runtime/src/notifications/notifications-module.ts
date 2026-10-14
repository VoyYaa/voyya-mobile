import { Platform } from 'react-native';

export type NotificationsModule = typeof import('expo-notifications');

let pending: Promise<NotificationsModule | null> | null = null;

export function loadNotificationsModule(): Promise<NotificationsModule | null> {
  if (Platform.OS === 'web') return Promise.resolve(null);
  if (pending === null) pending = import('expo-notifications').catch(() => null);
  return pending;
}

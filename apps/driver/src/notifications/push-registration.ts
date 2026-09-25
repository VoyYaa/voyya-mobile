import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { registerPushToken, revokePushToken } from '../api/push.api';
import { ensureAssignmentNotificationChannel } from './notification-channel';

function getEasProjectId(): string | undefined {
  return Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
}

function toPushTokenPlatform(): 'android' | 'ios' {
  return Platform.OS === 'ios' ? 'ios' : 'android';
}

async function resolveExpoPushToken(): Promise<string | null> {
  const projectId = getEasProjectId();
  if (!projectId) {
    console.warn('[push] missing extra.eas.projectId, cannot obtain a push token');
    return null;
  }
  try {
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    return data;
  } catch (error) {
    console.warn('[push] failed to obtain the Expo push token', error);
    return null;
  }
}

async function hasNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.status === 'granted') return true;
  if (!current.canAskAgain) return false;

  const requested = await Notifications.requestPermissionsAsync();
  return requested.status === 'granted';
}

export async function registerForPushNotifications(): Promise<void> {
  try {
    await ensureAssignmentNotificationChannel();

    const granted = await hasNotificationPermission();
    if (!granted) return;

    const token = await resolveExpoPushToken();
    if (!token) return;

    await registerPushToken({ token, platform: toPushTokenPlatform() });
  } catch (error) {
    console.warn('[push] registration failed', error);
  }
}

export async function revokeCurrentPushToken(): Promise<void> {
  try {
    const permissions = await Notifications.getPermissionsAsync();
    if (permissions.status !== 'granted') return;

    const token = await resolveExpoPushToken();
    if (!token) return;

    await revokePushToken({ token });
  } catch (error) {
    console.warn('[push] revocation failed', error);
  }
}

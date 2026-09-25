import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { ANDROID_ASSIGNMENT_CHANNEL_ID } from '@voyyaa/shared';

export const ASSIGNMENT_OFFER_SOUND_FILE = 'assignment_offer.wav';

export async function ensureAssignmentNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync(ANDROID_ASSIGNMENT_CHANNEL_ID, {
    name: 'Ofertas de viaje',
    importance: Notifications.AndroidImportance.MAX,
    sound: ASSIGNMENT_OFFER_SOUND_FILE,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
}

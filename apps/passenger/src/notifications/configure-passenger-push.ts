import { ANDROID_TRIP_UPDATES_CHANNEL_ID } from '@voyyaa/shared';
import { configurePushNotifications } from '@voyyaa/app-runtime';
import { registerPromptStateCleanup } from '../lib/notifications-prompt-runtime';
import { ensureTripUpdatesChannel } from './passenger-channel';

export function configurePassengerPush(): void {
  configurePushNotifications({
    channel: { id: ANDROID_TRIP_UPDATES_CHANNEL_ID, ensure: ensureTripUpdatesChannel },
    supportedPlatforms: ['android'],
    askPermissionOnSync: false,
  });
  registerPromptStateCleanup();
}

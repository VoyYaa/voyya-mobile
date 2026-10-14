import type { PushTokenPlatform } from '@voyyaa/shared';
import type { PushPermissionSnapshot } from './push-permission';

export type PushDevicePlatform = PushTokenPlatform | 'web';

export interface PushDevicePort {
  platform: PushDevicePlatform;
  isAvailable: () => Promise<boolean>;
  readPermission: () => Promise<PushPermissionSnapshot>;
  requestPermission: () => Promise<PushPermissionSnapshot>;
  isChannelEnabled: (channelId: string) => Promise<boolean>;
  getExpoPushToken: () => Promise<string>;
  dismissAllNotifications: () => Promise<void>;
}

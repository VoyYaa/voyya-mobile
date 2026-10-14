import { ExpoPushToken } from '@voyyaa/shared';
import type { SecureStoragePort } from '../session/secure-storage-port';

export const PUSH_TOKEN_KEY = 'voyya_push_token';

const DEVICE_ONLY = { thisDeviceOnly: true } as const;

export interface PushTokenStore {
  remember: (token: string) => Promise<void>;
  read: () => Promise<string | null>;
  forget: () => Promise<void>;
}

export function createPushTokenStore(getPort: () => SecureStoragePort): PushTokenStore {
  return {
    async remember(token) {
      await getPort().setItem(PUSH_TOKEN_KEY, token, DEVICE_ONLY);
    },
    async read() {
      const raw = await getPort()
        .getItem(PUSH_TOKEN_KEY)
        .catch(() => null);
      const parsed = ExpoPushToken.safeParse(raw);
      return parsed.success ? parsed.data : null;
    },
    async forget() {
      await getPort().deleteItem(PUSH_TOKEN_KEY);
    },
  };
}

import type { SecureStoragePort } from '../session/secure-storage-port';

export const PUSH_ASKED_KEY = 'voyya_push_permission_asked';

export interface PushAskedStore {
  read: () => Promise<boolean>;
  mark: () => Promise<void>;
}

export function createPushAskedStore(getPort: () => SecureStoragePort): PushAskedStore {
  return {
    async read() {
      const raw = await getPort()
        .getItem(PUSH_ASKED_KEY)
        .catch(() => null);
      return raw === '1';
    },
    async mark() {
      await getPort().setItem(PUSH_ASKED_KEY, '1');
    },
  };
}

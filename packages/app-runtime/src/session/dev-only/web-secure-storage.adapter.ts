import type { SecureStoragePort } from '../secure-storage-port';

interface WebStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

const KEY_PREFIX = 'voyya.dev-web.';

function getWebStorage(): WebStorage | null {
  const candidate = (globalThis as { sessionStorage?: WebStorage }).sessionStorage;
  return candidate ?? null;
}

export const webDevOnlySecureStoragePort: SecureStoragePort = {
  getItem: async (key) => getWebStorage()?.getItem(KEY_PREFIX + key) ?? null,
  setItem: async (key, value) => {
    getWebStorage()?.setItem(KEY_PREFIX + key, value);
  },
  deleteItem: async (key) => {
    getWebStorage()?.removeItem(KEY_PREFIX + key);
  },
};

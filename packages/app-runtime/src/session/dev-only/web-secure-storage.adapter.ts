import type { SecureStoragePort } from '../secure-storage-port';

export const webDevOnlySecureStoragePort: SecureStoragePort = {
  getItem: async () => null,
  setItem: async () => {},
  deleteItem: async () => {},
};

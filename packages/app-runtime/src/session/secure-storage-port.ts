import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { webDevOnlySecureStoragePort } from './dev-only/web-secure-storage.adapter';

export interface SecureStorageWriteOptions {
  thisDeviceOnly?: boolean;
}

export interface SecureStoragePort {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string, options?: SecureStorageWriteOptions) => Promise<void>;
  deleteItem: (key: string) => Promise<void>;
}

export const nativeSecureStoragePort: SecureStoragePort = {
  getItem: (key) => SecureStore.getItemAsync(key),
  setItem: (key, value, options) =>
    SecureStore.setItemAsync(
      key,
      value,
      options?.thisDeviceOnly
        ? { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY }
        : undefined,
    ),
  deleteItem: (key) => SecureStore.deleteItemAsync(key),
};

let activePort: SecureStoragePort =
  Platform.OS === 'web' ? webDevOnlySecureStoragePort : nativeSecureStoragePort;

export function setSecureStoragePort(port: SecureStoragePort): void {
  activePort = port;
}

export function getSecureStoragePort(): SecureStoragePort {
  return activePort;
}

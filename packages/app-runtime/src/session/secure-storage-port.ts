import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { webDevOnlySecureStoragePort } from './dev-only/web-secure-storage.adapter';

export interface SecureStoragePort {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  deleteItem: (key: string) => Promise<void>;
}

export const nativeSecureStoragePort: SecureStoragePort = {
  getItem: (key) => SecureStore.getItemAsync(key),
  setItem: (key, value) => SecureStore.setItemAsync(key, value),
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

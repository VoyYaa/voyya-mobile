import { Platform } from 'react-native';
import * as Application from 'expo-application';
import { getSecureStoragePort, onSessionCleared } from '@voyyaa/app-runtime';
import { pickupOriginStore } from './pickup-origin-runtime';
import { createStartCodeStore } from './start-code-store';

export const startCodeStore = createStartCodeStore({
  getItem: (key) => getSecureStoragePort().getItem(key),
  setItem: (key, value, options) => getSecureStoragePort().setItem(key, value, options),
  deleteItem: (key) => getSecureStoragePort().deleteItem(key),
});

onSessionCleared(() => startCodeStore.clear());

export async function wipeLocalTripDataOnFreshInstall(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const installedAt = await Application.getInstallationTimeAsync();
    const fresh = await startCodeStore.wipeOnFreshInstall(String(installedAt.getTime()));
    if (fresh) await pickupOriginStore.clear();
  } catch {
    return;
  }
}

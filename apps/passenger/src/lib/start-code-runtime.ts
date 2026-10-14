import { Platform } from 'react-native';
import * as Application from 'expo-application';
import { getSecureStoragePort, onSessionCleared } from '@voyyaa/app-runtime';
import {
  START_CODE_RECORD_READY_TIMEOUT_MS,
  START_CODE_RECORD_REFRESH_MS,
} from '../constants/parameters';
import { PICKUP_ORIGIN_KEY } from './pickup-origin-store';
import { createStartCodeRecordStore } from './start-code-store';

async function readInstallMarker(): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  const installedAt = await Application.getInstallationTimeAsync();
  return String(installedAt.getTime());
}

export const startCodeRecordStore = createStartCodeRecordStore({
  port: {
    getItem: (key) => getSecureStoragePort().getItem(key),
    setItem: (key, value, options) => getSecureStoragePort().setItem(key, value, options),
    deleteItem: (key) => getSecureStoragePort().deleteItem(key),
  },
  now: Date.now,
  companionKeys: [PICKUP_ORIGIN_KEY],
  refreshMs: START_CODE_RECORD_REFRESH_MS,
  readyTimeoutMs: START_CODE_RECORD_READY_TIMEOUT_MS,
  installMarker: readInstallMarker,
});

onSessionCleared(() => startCodeRecordStore.clear());

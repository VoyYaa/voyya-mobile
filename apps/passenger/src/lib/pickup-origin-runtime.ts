import { getSecureStoragePort, onSessionCleared } from '@voyyaa/app-runtime';
import { createPickupOriginStore } from './pickup-origin-store';

export const pickupOriginStore = createPickupOriginStore({
  getItem: (key) => getSecureStoragePort().getItem(key),
  setItem: (key, value, options) => getSecureStoragePort().setItem(key, value, options),
  deleteItem: (key) => getSecureStoragePort().deleteItem(key),
});

onSessionCleared(() => pickupOriginStore.clear());
